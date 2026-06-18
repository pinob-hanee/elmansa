import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { Role } from '@prisma/client';

export interface AdminUserFilters {
  page?: number;
  limit?: number;
  role?: Role;
  isEmailVerified?: boolean;
  search?: string;
}

export class UserService {
  async getUsers(filters: AdminUserFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.isEmailVerified !== undefined ? { isEmailVerified: filters.isEmailVerified } : {}),
      ...(filters.search
        ? {
            OR: [
              { email: { contains: filters.search, mode: 'insensitive' as const } },
              { profile: { firstName: { contains: filters.search, mode: 'insensitive' as const } } },
              { profile: { lastName: { contains: filters.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
        omit: { passwordHash: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async updateEmailVerification(
    adminId: string,
    userId: string,
    isVerified: boolean,
    reason?: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundError('User not found');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: isVerified },
      include: { profile: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: adminId,
        action: `EMAIL_VERIFICATION_CHANGED_TO_${isVerified}`,
        entity: 'User',
        entityId: userId,
        oldValues: { isEmailVerified: user.isEmailVerified },
        newValues: { isEmailVerified: isVerified, reason },
      },
    });

    // Notify user
    if (isVerified) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'ENROLLMENT_APPROVED',
          title: 'تم قبول حسابك!',
          message: 'تم قبول تسجيلك في المنصة. يمكنك الآن تسجيل في الدورات.',
          link: '/courses',
        },
      });
    }

    return updated;
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        enrollments: {
          include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } } },
          take: 10,
        },
        certificates: {
          include: { course: { select: { title: true } } },
        },
      },
      omit: { passwordHash: true },
    });
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    parentPhone?: string;
    grade?: string;
    school?: string;
    city?: string;
    bio?: string;
    facebookUrl?: string;
    twitterUrl?: string;
    language?: string;
    darkMode?: boolean;
  }) {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async getDashboardStats(userId: string) {
    const [
      enrolledCount,
      completedCount,
      inProgressCourses,
      recentActivity,
      notifications,
    ] = await Promise.all([
      prisma.enrollment.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        take: 5,
        orderBy: { lastAccessAt: 'desc' },
        include: {
          course: {
            select: { id: true, title: true, slug: true, thumbnailUrl: true, totalLessons: true },
          },
        },
      }),
      prisma.videoWatchHistory.findMany({
        where: { userId },
        take: 10,
        orderBy: { watchedAt: 'desc' },
        include: { lesson: { select: { title: true, chapter: { select: { module: { select: { course: { select: { title: true } } } } } } } } },
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      stats: { enrolledCount, completedCount, unreadNotifications: notifications },
      inProgressCourses,
      recentActivity,
    };
  }

  async getAdminAnalytics() {
    const [
      totalStudents,
      pendingStudents,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'STUDENT', isEmailVerified: false } }),
      prisma.course.count(),
      prisma.course.count({ where: { isPublished: true } }),
      prisma.enrollment.count(),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
        omit: { passwordHash: true },
      }),
    ]);

    return {
      totalStudents,
      pendingStudents,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      recentUsers,
    };
  }

  async getAdminChartData() {
    // Mocking 12 months of student growth and enrollments to avoid complex time-series queries for now
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const growthData = [];
    let baseStudents = 50;
    
    for (let i = 11; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      const newStudents = Math.floor(Math.random() * 20) + 5;
      baseStudents += newStudents;
      growthData.push({
        name: months[mIdx],
        students: baseStudents,
        enrollments: Math.floor(newStudents * 1.5)
      });
    }

    // Top courses (real data)
    const courses = await prisma.course.findMany({
      take: 5,
      orderBy: { totalEnrolled: 'desc' },
      select: { title: true, totalEnrolled: true }
    });
    
    const popularCoursesData = courses.map(c => ({
      name: c.title.substring(0, 15) + (c.title.length > 15 ? '...' : ''),
      students: c.totalEnrolled
    }));

    return {
      growthData,
      popularCoursesData
    };
  }
}
