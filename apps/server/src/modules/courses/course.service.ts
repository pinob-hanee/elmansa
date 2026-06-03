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

    return {
      courses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getCourseBySlug(slug: string, userId?: string) {
    const cacheKey = `course:${slug}`;
    const cached = await cache.get<any>(cacheKey);
    if (cached) return cached;

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
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } }
      });
      if (enrollment && enrollment.status !== 'DROPPED') {
        isEnrolled = true;
        enrollmentStatus = enrollment.status;
      }
    }

    const response = { ...course, isEnrolled, enrollmentStatus };
    await cache.set(cacheKey + (userId ? `:${userId}` : ''), response, 600); // 10 min cache
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
    return prisma.chapter.create({
      data: { ...data, moduleId, isPublished: true },
    });
  }

  async createLesson(chapterId: string, data: any) {
    const lesson = await prisma.lesson.create({
      data: { ...data, chapterId, isPublished: true },
    });
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

    return prisma.enrollment.create({
      data: { userId, courseId, status: 'ACTIVE' },
    });
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

  async getLessonVideoUrl(lessonId: string, userId: string) {
    // Check enrollment
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { chapter: { include: { module: { select: { courseId: true } } } } },
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
    }

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
        chapter: {
          select: {
            module: {
              select: { courseId: true }
            }
          }
        }
      },
    });

    if (!lesson) throw new NotFoundError('Lesson not found');

    const courseId = lesson.chapter.module.courseId;

    const isCompleted = lesson?.videoDuration
      ? watchedTime / lesson.videoDuration >= 0.9
      : false;

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
