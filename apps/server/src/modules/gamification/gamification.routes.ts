import { Router } from 'express';
import { prisma } from '../../config/database';
import { authenticate } from '../../api/middlewares/auth.middleware';
import { successResponse } from '../../utils/response';

const router = Router();

router.use(authenticate);

router.get('/stats', async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user!.userId },
      select: {
        xp: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
      }
    });

    const recentLogs = await prisma.xpLog.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    successResponse(res, { profile, recentLogs });
  } catch (error) {
    next(error);
  }
});

export default router;
