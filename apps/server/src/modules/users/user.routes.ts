import { Router } from 'express';
import { UserService } from './user.service';
import { authenticate } from '../../api/middlewares/auth.middleware';
import { successResponse, paginatedResponse } from '../../utils/response';

const router = Router();
const svc = new UserService();

// Get current user dashboard
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const data = await svc.getDashboardStats(req.user!.userId);
    successResponse(res, data);
  } catch (e) { next(e); }
});

// Get user profile (public)
router.get('/:id/profile', async (req, res, next) => {
  try {
    const user = await svc.getUserProfile(req.params.id);
    successResponse(res, user);
  } catch (e) { next(e); }
});

// Update own profile
router.patch('/me/profile', authenticate, async (req, res, next) => {
  try {
    const profile = await svc.updateProfile(req.user!.userId, req.body);
    successResponse(res, profile, 'Profile updated');
  } catch (e) { next(e); }
});

export default router;
