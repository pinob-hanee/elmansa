import { Router } from 'express';
import { UserService } from '../users/user.service';
import { authenticate, requireRole } from '../../api/middlewares/auth.middleware';
import { successResponse, paginatedResponse } from '../../utils/response';

const router = Router();
const userSvc = new UserService();

// All admin routes require authentication + admin/teacher role
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'TEACHER', 'MODERATOR'));

// Analytics dashboard
router.get('/analytics', requireRole('SUPER_ADMIN', 'TEACHER'), async (_req, res, next) => {
  try {
    const data = await userSvc.getAdminAnalytics();
    successResponse(res, data);
  } catch (e) { next(e); }
});

router.get('/analytics/charts', requireRole('SUPER_ADMIN', 'TEACHER'), async (_req, res, next) => {
  try {
    const data = await userSvc.getAdminChartData();
    successResponse(res, data);
  } catch (e) { next(e); }
});

// Student management
router.get('/students', async (req, res, next) => {
  try {
    const result = await userSvc.getUsers({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      role: 'STUDENT',
      approvalStatus: req.query.status as any,
      search: req.query.search as string,
    });
    paginatedResponse(res, result.users, result.meta);
  } catch (e) { next(e); }
});

// Approve / reject / suspend / ban
router.patch('/students/:id/status', requireRole('SUPER_ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const user = await userSvc.updateApprovalStatus(
      req.user!.userId,
      req.params.id,
      req.body.status,
      req.body.reason
    );
    successResponse(res, user, `Student status updated to ${req.body.status}`);
  } catch (e) { next(e); }
});

// All users list
router.get('/users', requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    const result = await userSvc.getUsers({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      role: req.query.role as any,
      search: req.query.search as string,
    });
    paginatedResponse(res, result.users, result.meta);
  } catch (e) { next(e); }
});

// Community Moderation
import { CommunityService } from '../community/community.service';
const communitySvc = new CommunityService();

router.get('/community/posts', async (req, res, next) => {
  try {
    const result = await communitySvc.getAdminPosts({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
      search: req.query.search as string,
    });
    paginatedResponse(res, result.posts, result.meta);
  } catch (e) { next(e); }
});

router.delete('/community/posts/:id', async (req, res, next) => {
  try {
    await communitySvc.deletePost(req.params.id, req.user!.userId, req.user!.role);
    successResponse(res, null, 'Post deleted');
  } catch (e) { next(e); }
});

export default router;
