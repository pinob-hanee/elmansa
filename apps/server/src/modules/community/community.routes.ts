import { Router } from 'express';
import { CommunityService } from './community.service';
import { authenticate, requireRole } from '../../api/middlewares/auth.middleware';
import { successResponse, paginatedResponse } from '../../utils/response';

const router = Router();
const svc = new CommunityService();

// List posts (public)
router.get('/posts', async (req, res, next) => {
  try {
    const result = await svc.listPosts({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      courseId: req.query.courseId as string,
      type: req.query.type as string,
      search: req.query.search as string,
    });
    paginatedResponse(res, result.posts, result.meta);
  } catch (e) { next(e); }
});

// Create post
router.post('/posts', authenticate, async (req, res, next) => {
  try {
    const post = await svc.createPost(req.user!.userId, req.body);
    successResponse(res, post, 'Post created', 201);
  } catch (e) { next(e); }
});

// Delete post
router.delete('/posts', authenticate, async (req, res, next) => {
  try {
    await svc.deletePost(req.body.postId, req.user!.userId, req.user!.role);
    successResponse(res, null, 'Post deleted');
  } catch (e) { next(e); }
});

// Pin post (admin/teacher/mod)
router.patch('/posts/pin', authenticate, requireRole('SUPER_ADMIN', 'TEACHER', 'MODERATOR'), async (req, res, next) => {
  try {
    const post = await svc.togglePin(req.body.postId);
    successResponse(res, post);
  } catch (e) { next(e); }
});

// Add comment
router.post('/posts/comments', authenticate, async (req, res, next) => {
  try {
    const comment = await svc.addComment(
      req.body.postId,
      req.user!.userId,
      req.body.content,
      req.body.parentId
    );
    successResponse(res, comment, 'Comment added', 201);
  } catch (e) { next(e); }
});

// Toggle reaction
router.post('/reactions', authenticate, async (req, res, next) => {
  try {
    const result = await svc.toggleReaction(
      req.user!.userId,
      req.body.postId,
      req.body.commentId,
      req.body.type
    );
    successResponse(res, result);
  } catch (e) { next(e); }
});

// Report post
router.post('/reports', authenticate, async (req, res, next) => {
  try {
    const report = await svc.reportPost(
      req.user!.userId,
      req.body.targetId,
      req.body.postId,
      req.body.reason,
      req.body.details
    );
    successResponse(res, report, 'Report submitted', 201);
  } catch (e) { next(e); }
});

// Get comments for a post
router.get('/posts/comments', async (req, res, next) => {
  try {
    const result = await svc.getComments(
      req.query.postId as string,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    paginatedResponse(res, result.comments, result.meta);
  } catch (e) { next(e); }
});

router.delete('/posts/comments', authenticate, async (req, res, next) => {
  try {
    const result = await svc.deleteComment(req.body.commentId, req.user!.userId, req.user!.role);
    successResponse(res, result, 'Comment deleted successfully');
  } catch (e) { next(e); }
});

// Notifications
router.get('/notifications', authenticate, async (req, res, next) => {
  try {
    const result = await svc.getNotifications(
      req.user!.userId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 20
    );
    paginatedResponse(res, result.notifications, result.meta);
  } catch (e) { next(e); }
});

router.get('/notifications/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await svc.getUnreadNotificationCount(req.user!.userId);
    successResponse(res, { count });
  } catch (e) { next(e); }
});

router.patch('/notifications/read', authenticate, async (req, res, next) => {
  try {
    const notif = await svc.markNotificationRead(req.body.notificationId, req.user!.userId);
    successResponse(res, notif);
  } catch (e) { next(e); }
});

export default router;
