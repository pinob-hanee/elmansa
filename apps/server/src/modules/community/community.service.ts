import { prisma } from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export interface PostFilters {
  page?: number;
  limit?: number;
  courseId?: string;
  type?: string;
  search?: string;
}

export class CommunityService {
  async listPosts(filters: PostFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { content: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          author: {
            select: { id: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
          course: { select: { id: true, title: true, slug: true } },
          reactions: true,
          _count: { select: { comments: true, reactions: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    return { posts, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getAdminPosts(filters: any) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { content: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
          },
          course: { select: { title: true } },
          _count: { select: { reports: true, comments: true } },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    return { posts, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createPost(authorId: string, data: {
    content: string;
    title?: string;
    type?: string;
    courseId?: string;
    hashtags?: string[];
    imageUrls?: string[];
  }) {
    return prisma.communityPost.create({
      data: {
        authorId,
        content: data.content,
        title: data.title,
        type: (data.type as any) || 'DISCUSSION',
        courseId: data.courseId,
        hashtags: data.hashtags || [],
        imageUrls: data.imageUrls || [],
      },
      include: {
        author: {
          select: { id: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    });
  }

  async deletePost(postId: string, userId: string, role: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError('Post not found');

    if (post.authorId !== userId && !['SUPER_ADMIN', 'TEACHER', 'MODERATOR'].includes(role)) {
      throw new ForbiddenError();
    }

    await prisma.communityPost.update({
      where: { id: postId },
      data: { isDeleted: true },
    });
  }

  async togglePin(postId: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundError();
    return prisma.communityPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });
  }

  async addComment(postId: string, authorId: string, content: string, parentId?: string) {
    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post || post.isLocked) throw new ForbiddenError('Post is locked or not found');

    const comment = await prisma.comment.create({
      data: { postId, authorId, content, parentId },
      include: {
        author: {
          select: { id: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
        },
      },
    });

    // Notify post author
    if (post.authorId !== authorId) {
      await prisma.notification.create({
        data: {
          userId: post.authorId,
          senderId: authorId,
          type: 'COMMUNITY_REPLY',
          title: 'تعليق جديد على منشورك',
          message: content.substring(0, 100),
          link: `/community/post/${postId}`,
        },
      });
    }

    return comment;
  }

  async toggleReaction(userId: string, postId?: string, commentId?: string, type = 'LIKE') {
    const existing = await prisma.reaction.findFirst({
      where: { userId, postId, commentId, type: type as any },
    });

    if (existing) {
      await prisma.reaction.delete({ where: { id: existing.id } });
      return { action: 'removed' };
    }

    await prisma.reaction.create({
      data: { userId, postId, commentId, type: type as any },
    });
    return { action: 'added' };
  }

  async reportPost(filerId: string, targetId: string, postId: string, reason: string, details?: string) {
    return prisma.report.create({
      data: { filerId, targetId, postId, reason, details },
    });
  }

  async getComments(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId, isDeleted: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          author: {
            select: { id: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          },
          _count: { select: { reactions: true, replies: true } },
        },
      }),
      prisma.comment.count({ where: { postId, isDeleted: false } })
    ]);

    return { comments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, profile: { select: { firstName: true, lastName: true, avatarUrl: true } } },
          }
        }
      }),
      prisma.notification.count({ where: { userId } })
    ]);
    return { notifications, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUnreadNotificationCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  async markNotificationRead(id: string, userId: string) {
    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) throw new NotFoundError('Notification not found');
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() }
    });
  }
}
