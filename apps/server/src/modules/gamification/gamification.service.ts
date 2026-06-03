import { prisma } from '../../config/database';

export class GamificationService {
  private readonly XP_PER_LEVEL = 1000;

  async awardXp(userId: string, amount: number, reason: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) return;

    const newXp = profile.xp + amount;
    const newLevel = Math.floor(newXp / this.XP_PER_LEVEL) + 1;

    await prisma.$transaction([
      prisma.profile.update({
        where: { userId },
        data: {
          xp: newXp,
          level: newLevel,
        }
      }),
      prisma.xpLog.create({
        data: {
          userId,
          amount,
          reason,
        }
      })
    ]);

    return { xp: newXp, level: newLevel, leveledUp: newLevel > profile.level };
  }

  async awardXpWithAchievements(userId: string, amount: number, reason: string) {
    const result = await this.awardXp(userId, amount, reason);
    // Check achievements in background (non-blocking)
    try {
      const { AchievementService } = await import('./achievement.service');
      const achSvc = new AchievementService();
      const newBadges = await achSvc.checkAndAward(userId);
      return { ...result, newBadges };
    } catch (err) {
      console.error('Achievement check failed:', err);
      return { ...result, newBadges: [] as string[] };
    }
  }

  async updateStreak(userId: string) {
    const profile = await prisma.profile.findUnique({
      where: { userId }
    });

    if (!profile) return;

    const now = new Date();
    const lastActivity = profile.lastActivityAt;
    let newStreak = profile.currentStreak;
    let newLongest = profile.longestStreak;

    if (!lastActivity) {
      newStreak = 1;
      newLongest = 1;
    } else {
      const msPerDay = 1000 * 60 * 60 * 24;
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastDay = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
      
      const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / msPerDay);

      if (diffDays === 0) {
        // Already updated today, no need to write to DB again
        return { currentStreak: newStreak };
      } else if (diffDays === 1) {
        // Active yesterday, increment streak
        newStreak += 1;
        if (newStreak > newLongest) newLongest = newStreak;
      } else if (diffDays > 1) {
        // Missed a day, reset streak
        newStreak = 1;
      }
    }

    await prisma.profile.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityAt: now,
      }
    });

    return { currentStreak: newStreak };
  }
}
