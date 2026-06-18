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
      isEmailVerified: req.query.isVerified === 'true' ? true : req.query.isVerified === 'false' ? false : undefined,
      search: req.query.search as string,
    });
    paginatedResponse(res, result.users, result.meta);
  } catch (e) { next(e); }
});

// Approve / reject / suspend / ban
router.patch('/students/verify', requireRole('SUPER_ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const user = await userSvc.updateEmailVerification(
      req.user!.userId,
      req.body.studentId,
      req.body.isVerified,
      req.body.reason
    );
    successResponse(res, user, `Student verification updated`);
  } catch (e) { next(e); }
});

// Alias for legacy or alternative status updates
router.patch('/students/:id/status', requireRole('SUPER_ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const isVerified = req.body.isVerified !== undefined 
      ? req.body.isVerified 
      : (req.body.status === 'APPROVED' || req.body.status === 'VERIFIED' || req.body.status === true);
    
    const user = await userSvc.updateEmailVerification(
      req.user!.userId,
      req.params.id,
      isVerified,
      req.body.reason
    );
    successResponse(res, user, `Student status updated`);
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

// Student enrollments
import { CourseService } from '../courses/course.service';
const courseSvc = new CourseService();

router.get('/students/enrollments', requireRole('SUPER_ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const enrollments = await courseSvc.getStudentEnrollments(req.query.studentId as string);
    successResponse(res, enrollments);
  } catch (e) { next(e); }
});

router.patch('/students/enrollments/drop', requireRole('SUPER_ADMIN', 'TEACHER'), async (req, res, next) => {
  try {
    const result = await courseSvc.dropEnrollment(req.body.studentId, req.body.courseId);
    successResponse(res, result, 'Enrollment dropped');
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

router.delete('/community/posts', async (req, res, next) => {
  try {
    // Note: express router.delete accepts body in some clients, but query might be safer for REST compliance.
    // Given the user requested 'don't pass id in url', we'll accept it from the body.
    await communitySvc.deletePost(req.body.postId || req.query.postId as string, req.user!.userId, req.user!.role);
    successResponse(res, null, 'Post deleted');
  } catch (e) { next(e); }
});

export default router;
