import { prisma } from '../../config/database';
import { cache } from '../../config/redis';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { Prisma } from '@prisma/client';

export interface CourseFilters {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  level?: string;
  isFree?: boolean;
  isPublished?: boolean;
}

export class CourseService {
  async listCourses(filters: CourseFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    // Cache key for public listing
    const cacheKey = `courses:list:${JSON.stringify(filters)}`;
    if (filters.isPublished !== false) { // Don't cache admin queries
      const cached = await cache.get<any>(cacheKey);
      if (cached) return cached;
    }

    const where: Prisma.CourseWhereInput = {
      ...(filters.isPublished !== undefined ? { isPublished: filters.isPublished } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.level ? { level: filters.level as any } : {}),
      ...(filters.isFree !== undefined ? { price: filters.isFree ? 0 : { gt: 0 } } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: { select: { enrollments: true, modules: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);

    const result = {
      courses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    if (filters.isPublished !== false) {
      await cache.set(cacheKey, result, 300); // Cache for 5 minutes
    }

    return result;
  }

  async getCourseBySlug(slug: string, userId?: string) {
    // Only cache the public (no-user) version to avoid stale progress data
    const cacheKey = `course:${slug}`;
    if (!userId) {
      const cached = await cache.get<any>(cacheKey);
      if (cached) return cached;
    }

    const course = await prisma.course.findUnique({
      where: { slug },
      include: {
        category: true,
        modules: {
          where: { isPublished: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              where: { isPublished: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                lessons: {
                  where: { isPublished: true },
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    id: true,
                    title: true,
                    titleAr: true,
                    type: true,
                    duration: true,
                    isFree: true,
                    sortOrder: true,
                  },
                },
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) throw new NotFoundError('Course not found');

    let isEnrolled = false;
    let enrollmentStatus: string | null = null;
    let completedLessonIds = new Set<string>();
    let certificate: any = null;

    if (userId) {
      const [enrollment, progressRecords, cert, studentDeadlines] = await Promise.all([
        prisma.enrollment.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } }
        }),
        prisma.lessonProgress.findMany({
          where: { userId, lesson: { chapter: { module: { courseId: course.id } } } },
          select: { lessonId: true, isCompleted: true, completedAt: true },
        }),
        prisma.certificate.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } }
        }),
        prisma.studentChapterDeadline.findMany({
          where: { userId, chapter: { module: { courseId: course.id } } }
        })
      ]);
      certificate = cert;

      if (enrollment && enrollment.status !== 'DROPPED') {
        isEnrolled = true;
        enrollmentStatus = enrollment.status;
      }

      progressRecords.filter(p => p.isCompleted).forEach(p => completedLessonIds.add(p.lessonId));

      const deadlineMap = new Map<string, Date>();
      studentDeadlines.forEach(d => deadlineMap.set(d.chapterId, d.deadline));

      // Flatten chapters to check previous chapter progress
      const allChapters = course.modules.flatMap(m => m.chapters);
      
      let previousChapterCompletedInTime = true;

      const modulesWithProgress = course.modules.map((mod) => ({
        ...mod,
        chapters: mod.chapters.map((ch) => {
          // Check if current chapter is locked
          const isLocked = !previousChapterCompletedInTime;
          
          let chapterCompleted = true;
          let maxCompletedAt: Date | null = null;

          const lessons = ch.lessons.map((lesson) => {
            const progress = progressRecords.find(p => p.lessonId === lesson.id);
            const isLessonCompleted = !!(progress?.isCompleted);
            
            if (!isLessonCompleted) chapterCompleted = false;
            if (isLessonCompleted && progress?.completedAt) {
              if (!maxCompletedAt || progress.completedAt > maxCompletedAt) {
                maxCompletedAt = progress.completedAt;
              }
            }

            return {
              ...lesson,
              isCompleted: isLessonCompleted,
            };
          });

          // Determine if this chapter was completed before its deadline
          if (chapterCompleted) {
            const effectiveDeadline = deadlineMap.get(ch.id) || ch.deadline;
            if (effectiveDeadline && maxCompletedAt) {
              if ((maxCompletedAt as Date).getTime() > effectiveDeadline.getTime()) {
                previousChapterCompletedInTime = false;
              }
            }
          } else {
            previousChapterCompletedInTime = false;
          }

          return {
            ...ch,
            isLocked,
            effectiveDeadline: deadlineMap.get(ch.id) || ch.deadline || null,
            lessons,
          };
        }),
      }));

      course.modules = modulesWithProgress as any;
    } else {
      // Inject isCompleted and isLocked = false for non-logged in users
      course.modules = course.modules.map((mod) => ({
        ...mod,
        chapters: mod.chapters.map((ch) => ({
          ...ch,
          isLocked: false,
          effectiveDeadline: ch.deadline || null,
          lessons: ch.lessons.map((lesson) => ({
            ...lesson,
            isCompleted: false,
          })),
        })),
      })) as any;
    }

    const response = { 
      ...course, 
      isEnrolled, 
      enrollmentStatus,
      certificateCode: enrollmentStatus === 'COMPLETED' ? certificate?.uniqueCode : undefined 
    };

    if (!userId) {
      await cache.set(cacheKey, response, 600);
    }

    return response;
  }

  async getFullCourseForAdmin(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              orderBy: { sortOrder: 'asc' },
              include: {
                lessons: {
                  orderBy: { sortOrder: 'asc' },
                  select: {
                    id: true, title: true, type: true,
                    duration: true, isFree: true, isPublished: true, sortOrder: true,
                    videoKey: true, pdfKey: true,
                  },
                },
              },
            },
          },
        },
        _count: { select: { enrollments: true, modules: true } },
      },
    });
    if (!course) throw new NotFoundError('Course not found');
    return course;
  }

  async createCourse(teacherId: string, data: any) {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '')
      .replace(/\s+/g, '-')
      .concat('-', Date.now().toString());

    const course = await prisma.course.create({
      data: { ...data, slug, teacherId },
    });

    await cache.delPattern('courses:*');
    return course;
  }

  async updateCourse(courseId: string, teacherId: string, data: any) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('Course not found');
    if (course.teacherId !== teacherId) throw new ForbiddenError();

    const updated = await prisma.course.update({ where: { id: courseId }, data });
    await cache.del(`course:${course.slug}`);
    return updated;
  }

  async deleteCourse(courseId: string, teacherId: string, role: string) {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundError('Course not found');
    if (course.teacherId !== teacherId && !['SUPER_ADMIN'].includes(role)) {
      throw new ForbiddenError();
    }
    await prisma.course.delete({ where: { id: courseId } });
    await cache.del(`course:${course.slug}`);
  }

  // Curriculum Building
  async createModule(courseId: string, data: any) {
    return prisma.module.create({
      data: { ...data, courseId, isPublished: true },
    });
  }

  async createChapter(moduleId: string, data: any) {
    const chapter = await prisma.chapter.create({
      data: { ...data, moduleId, isPublished: true },
    });
    await cache.delPattern('course:*');
    return chapter;
  }

  async moveChapter(chapterId: string, targetModuleId: string) {
    const updated = await prisma.chapter.update({
      where: { id: chapterId },
      data: { moduleId: targetModuleId },
    });
    await cache.delPattern('course:*');
    return updated;
  }

  async deleteChapter(chapterId: string) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { module: true, lessons: true },
    });
    if (!chapter) throw new NotFoundError('Chapter not found');

    const totalLessons = chapter.lessons.length;
    const totalDuration = chapter.lessons.reduce((acc, lesson) => acc + (lesson.duration || 0), 0);

    await prisma.chapter.delete({ where: { id: chapterId } });

    const courseId = chapter.module?.courseId;
    if (courseId && (totalLessons > 0 || totalDuration > 0)) {
      await prisma.course.update({
        where: { id: courseId },
        data: {
          totalLessons: { decrement: totalLessons },
          totalDuration: { decrement: totalDuration },
        },
      });
    }

    await cache.delPattern('course:*');
    return { deleted: true };
  }

  async updateChapterDeadline(chapterId: string, deadline: Date | null) {
    return prisma.chapter.update({
      where: { id: chapterId },
      data: { deadline },
    });
  }

  async getStudentDeadlinesForChapter(chapterId: string) {
    const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { module: { select: { courseId: true } } } });
    if (!chapter) throw new NotFoundError('Chapter not found');
    
    const enrollments = await prisma.enrollment.findMany({
      where: { courseId: chapter.module.courseId },
      include: { user: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } } }
    });

    const deadlines = await prisma.studentChapterDeadline.findMany({
      where: { chapterId },
    });

    return enrollments.map(e => {
      const d = deadlines.find(x => x.userId === e.userId);
      return {
        userId: e.userId,
        user: e.user,
        deadline: d ? d.deadline : null,
      };
    });
  }

  async setStudentDeadline(chapterId: string, userId: string, deadline: Date | null) {
    if (!deadline) {
      await prisma.studentChapterDeadline.deleteMany({
        where: { userId, chapterId }
      });
      return { message: 'Deadline reset' };
    }
    return prisma.studentChapterDeadline.upsert({
      where: { userId_chapterId: { userId, chapterId } },
      create: { userId, chapterId, deadline },
      update: { deadline },
    });
  }

  async createLesson(chapterId: string, data: any) {
    const lesson = await prisma.lesson.create({
      data: { ...data, chapterId, isPublished: true },
    });

    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { module: true },
    });

    if (chapter?.module?.courseId) {
      await prisma.course.update({
        where: { id: chapter.module.courseId },
        data: {
          totalLessons: { increment: 1 },
          totalDuration: { increment: data.duration || 0 }
        }
      });
    }

    await cache.delPattern('course:*');
    return lesson;
  }

  async updateLesson(lessonId: string, data: any) {
    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data,
    });
    await cache.delPattern('course:*');
    return lesson;
  }

  async deleteLesson(lessonId: string) {
    // Fetch the lesson first to get duration and chapterId
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { module: true } } },
    });
    if (!lesson) throw new Error('Lesson not found');

    await prisma.lesson.delete({ where: { id: lessonId } });

    // Decrement totalLessons (and duration if applicable) on the course
    const courseId = lesson.chapter?.module?.courseId;
    if (courseId) {
      await prisma.course.update({
        where: { id: courseId },
        data: {
          totalLessons: { decrement: 1 },
          totalDuration: { decrement: lesson.duration || 0 },
        },
      });
    }

    await cache.delPattern('course:*');
    return { deleted: true };
  }

  async enrollStudent(courseId: string, userId: string) {
    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      if (existing.status === 'DROPPED') {
        // Re-enroll a dropped student
        return prisma.enrollment.update({
          where: { userId_courseId: { userId, courseId } },
          data: { status: 'ACTIVE' },
        });
      }
      if (existing.status === 'COMPLETED' || existing.status === 'ACTIVE') {
        // Already in the course — just return the existing enrollment (idempotent)
        return existing;
      }
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId, courseId, status: 'ACTIVE' },
    });

    await prisma.course.update({
      where: { id: courseId },
      data: { totalEnrolled: { increment: 1 } }
    });

    return enrollment;
  }

  async getStudentEnrollments(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, thumbnailUrl: true } } },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async dropEnrollment(userId: string, courseId: string) {
    return prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: { status: 'DROPPED' },
    });
  }

  async ensureChapterDeadlineStarted(userId: string, chapterId: string) {
    const existingDeadline = await prisma.studentChapterDeadline.findUnique({
      where: { userId_chapterId: { userId, chapterId } }
    });
    if (!existingDeadline) {
      // Set deadline exactly 3 days from now
      await prisma.studentChapterDeadline.create({
        data: {
          userId,
          chapterId,
          deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      });
    }
  }

  async getLessonVideoUrl(lessonId: string, userId: string) {
    // Check enrollment
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { module: { include: { course: { select: { slug: true } } } } } } },
    });
    if (!lesson) throw new NotFoundError('Lesson not found');

    if (!lesson.isFree) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: lesson.chapter.module.courseId,
          status: { in: ['ACTIVE', 'COMPLETED'] },
        },
      });
      if (!enrollment) throw new ForbiddenError('You are not enrolled in this course');
      
      const courseWithProgress = await this.getCourseBySlug(lesson.chapter.module.course.slug, userId);
      const chapter = courseWithProgress.modules.flatMap((m: any) => m.chapters).find((c: any) => c.id === lesson.chapterId);
      if (chapter?.isLocked) {
        throw new ForbiddenError('This chapter is locked due to an uncompleted previous chapter or missed deadline.');
      }
    }

    // Ensure deadline starts when they access the lesson (for free and paid)
    await this.ensureChapterDeadlineStarted(userId, lesson.chapterId);

    if (lesson.type === 'TEXT') {
      return { content: lesson.content || '' };
    }

    let fileKey = lesson.videoKey;
    let resourceType: 'video' | 'image' | 'raw' | 'auto' = 'video';
    let format: string | undefined = undefined;

    if (lesson.type === 'PDF') {
      fileKey = lesson.pdfKey;
      resourceType = 'image'; // Cloudinary treats PDFs as images
      format = 'pdf'; // Force Cloudinary to serve it with .pdf extension
    }

    if (!fileKey) throw new NotFoundError('Content not found for this lesson');

    // Generate signed URL
    const { generateSignedUrl } = await import('../media/media.service');
    return { url: generateSignedUrl(fileKey, resourceType, format) };
  }

  async updateLessonProgress(lessonId: string, userId: string, watchedTime: number) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        videoDuration: true,
        type: true,
        chapter: {
          select: {
            id: true,
            module: {
              select: { course: { select: { id: true, slug: true } } }
            }
          }
        }
      },
    });

    if (!lesson) throw new NotFoundError('Lesson not found');

    const courseId = lesson.chapter.module.course.id;

    const courseWithProgress = await this.getCourseBySlug(lesson.chapter.module.course.slug, userId);
    const chapter = courseWithProgress.modules.flatMap((m: any) => m.chapters).find((c: any) => c.id === lesson.chapter.id);
    if (chapter?.isLocked) {
      throw new ForbiddenError('This chapter is locked due to an uncompleted previous chapter or missed deadline.');
    }

    // Videos: need 90% watched. PDF, TEXT, QUIZ: always mark completed on progress update
    const isCompleted = lesson?.videoDuration
      ? watchedTime / lesson.videoDuration >= 0.9
      : true; // PDF, TEXT, QUIZ — any progress call = completed

    const existing = await prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } }
    });

    const wasAlreadyCompleted = existing?.isCompleted;

    const result = await prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        watchedTime,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      update: {
        watchedTime,
        isCompleted: isCompleted || existing?.isCompleted, // Never un-complete a lesson
        completedAt: (!existing?.isCompleted && isCompleted) ? new Date() : existing?.completedAt,
      },
    });

    let xpEarned = 0;
    let newBadges: string[] = [];
    let courseCompleted = false;
    let certificateCode: string | null = null;

    if (isCompleted && !wasAlreadyCompleted) {
      try {
        const { GamificationService } = await import('../gamification/gamification.service');
        const gamificationSvc = new GamificationService();
        const gResult = await gamificationSvc.awardXpWithAchievements(userId, 50, 'LESSON_COMPLETION');
        xpEarned = 50;
        newBadges = gResult?.newBadges || [];
      } catch (err) {
        console.error('Failed to award XP for lesson completion:', err);
      }

      // Check if the entire course is now complete
      try {
        const completionResult = await this.checkAndCompleteCourse(userId, courseId);
        if (completionResult.completed) {
          courseCompleted = true;
          certificateCode = completionResult.certificateCode;
          xpEarned += completionResult.bonusXp;
          newBadges = [...newBadges, ...(completionResult.newBadges || [])];
        }
      } catch (err) {
        console.error('Failed to check course completion:', err);
      }
    }

    return {
      ...result,
      xpEarned,
      newBadges,
      courseCompleted,
      certificateCode,
    };
  }

  private async checkAndCompleteCourse(userId: string, courseId: string) {
    // Get total published lesson count for this course
    const totalLessons = await prisma.lesson.count({
      where: {
        isPublished: true,
        chapter: { isPublished: true, module: { isPublished: true, courseId } }
      }
    });

    if (totalLessons === 0) return { completed: false, bonusXp: 0, certificateCode: null, newBadges: [] };

    // Get completed lessons for this course
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        isCompleted: true,
        lesson: {
          isPublished: true,
          chapter: { isPublished: true, module: { isPublished: true, courseId } }
        }
      }
    });

    if (completedLessons < totalLessons) return { completed: false, bonusXp: 0, certificateCode: null, newBadges: [] };

    // Check if already completed
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } }
    });

    if (!enrollment || enrollment.status === 'COMPLETED') {
      return { completed: false, bonusXp: 0, certificateCode: null, newBadges: [] };
    }

    // Generate unique certificate code
    const uniqueCode = `CERT-${courseId.slice(0, 8).toUpperCase()}-${userId.slice(0, 8).toUpperCase()}-${Date.now()}`;

    // Mark enrollment as COMPLETED and generate certificate atomically
    await prisma.$transaction([
      prisma.enrollment.update({
        where: { userId_courseId: { userId, courseId } },
        data: { status: 'COMPLETED', completedAt: new Date(), progress: 100 }
      }),
      prisma.certificate.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId, certificateUrl: `/certificate/${uniqueCode}`, uniqueCode },
        update: { certificateUrl: `/certificate/${uniqueCode}` }
      })
    ]);

    // Award 500 bonus XP + check achievements
    let newBadges: string[] = [];
    try {
      const { GamificationService } = await import('../gamification/gamification.service');
      const gamificationSvc = new GamificationService();
      const gResult = await gamificationSvc.awardXpWithAchievements(userId, 500, 'COURSE_COMPLETION');
      newBadges = gResult?.newBadges || [];
    } catch (err) {
      console.error('Failed to award course completion XP:', err);
    }

    return { completed: true, bonusXp: 500, certificateCode: uniqueCode, newBadges };
  }

  async getCategories() {
    const cacheKey = 'categories:all';
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const cats = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    await cache.set(cacheKey, cats, 3600);
    return cats;
  }
}
