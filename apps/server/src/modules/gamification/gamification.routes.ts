import { Router } from 'express';
import { prisma } from '../../config/database';
import { authenticate, requireVerifiedStudent } from '../../api/middlewares/auth.middleware';
import { successResponse } from '../../utils/response';

const router = Router();

router.use(authenticate);

// ----- Stats -----
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

// ----- Leaderboard (top 50 by total XP) -----
router.get('/leaderboard', requireVerifiedStudent, async (req, res, next) => {
  try {
    const leaders = await prisma.profile.findMany({
      where: {
        user: {
          role: 'STUDENT',
        isEmailVerified: true,
        }
      },
      orderBy: { xp: 'desc' },
      take: 50,
      select: {
        xp: true,
        level: true,
        currentStreak: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        city: true,
        userId: true,
      }
    });

    // Add rank and mask last name for privacy
    const ranked = leaders.map((p, idx) => ({
      rank: idx + 1,
      userId: p.userId,
      name: `${p.firstName} ${p.lastName?.charAt(0) || ''}.`,
      avatarUrl: p.avatarUrl,
      city: p.city,
      xp: p.xp,
      level: p.level,
      currentStreak: p.currentStreak,
    }));

    successResponse(res, ranked);
  } catch (error) {
    next(error);
  }
});

// ----- My Achievements -----
router.get('/achievements', requireVerifiedStudent, async (req, res, next) => {
  try {
    const [allAchievements, earned] = await Promise.all([
      prisma.achievement.findMany({ orderBy: { points: 'asc' } }),
      prisma.userAchievement.findMany({
        where: { userId: req.user!.userId },
        select: { achievementId: true, earnedAt: true },
      }),
    ]);

    const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));

    const result = allAchievements.map((a) => ({
      ...a,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) ?? null,
    }));

    successResponse(res, result);
  } catch (error) {
    next(error);
  }
});

// ----- My Certificates -----
router.get('/certificates', requireVerifiedStudent, async (req, res, next) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: req.user!.userId },
      include: {
        course: { select: { title: true, thumbnailUrl: true, slug: true } }
      },
      orderBy: { issueDate: 'desc' },
    });

    successResponse(res, certificates);
  } catch (error) {
    next(error);
  }
});

// ----- Public Certificate View (no auth required for sharing) -----
router.get('/certificate/:code', async (req, res, next) => {
  try {
    const cert = await prisma.certificate.findUnique({
      where: { uniqueCode: req.params.code },
      include: {
        user: {
          select: { profile: { select: { firstName: true, lastName: true } } }
        },
        course: { select: { title: true, thumbnailUrl: true } }
      }
    });

    if (!cert) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    successResponse(res, cert);
  } catch (error) {
    next(error);
  }
});

export default router;
