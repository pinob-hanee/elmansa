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
    if (userId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: course.id } }
      });
      if (enrollment) isEnrolled = true;
    }

    const response = { ...course, isEnrolled };
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
        // Re-enroll
        return prisma.enrollment.update({
          where: { userId_courseId: { userId, courseId } },
          data: { status: 'ACTIVE' },
        });
      }
      throw new Error('Already enrolled or pending');
    }

    return prisma.enrollment.create({
      data: { userId, courseId, status: 'ACTIVE' },
    });
  }

  async getStudentEnrollments(userId: string) {
    return prisma.enrollment.findMany({
      where: { userId },
      include: { course: { select: { id: true, title: true, thumbnail: true } } },
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
          status: 'ACTIVE',
        },
      });
      if (!enrollment) throw new ForbiddenError('You are not enrolled in this course');
    }

    if (!lesson.videoKey) throw new NotFoundError('Video not found');

    // Generate signed URL
    const { generateSignedUrl } = await import('../media/media.service');
    return generateSignedUrl(lesson.videoKey);
  }

  async updateLessonProgress(lessonId: string, userId: string, watchedTime: number) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { videoDuration: true },
    });

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
    if (isCompleted && !wasAlreadyCompleted) {
      try {
        const { GamificationService } = await import('../gamification/gamification.service');
        const gamificationSvc = new GamificationService();
        await gamificationSvc.awardXp(userId, 50, 'LESSON_COMPLETION'); // 50 XP per lesson
        xpEarned = 50;
      } catch (err) {
        console.error('Failed to award XP for lesson completion:', err);
      }
    }

    return {
      ...result,
      xpEarned
    };
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
