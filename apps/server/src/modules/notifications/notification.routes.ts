import { Router } from 'express';
import { authenticate } from '../../api/middlewares/auth.middleware';
import { prisma } from '../../config/database';
import { successResponse } from '../../utils/response';

const router = Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 20;
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    successResponse(res, notifications);
  } catch (e) { next(e); }
});

router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true, readAt: new Date() },
    });
    successResponse(res, null, 'Marked as read');
  } catch (e) { next(e); }
});

router.patch('/read-all', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    successResponse(res, null, 'All notifications marked as read');
  } catch (e) { next(e); }
});

export default router;
