import { prisma } from '../../config/database';

export interface AchievementCheck {
  userId: string;
  xp: number;
  level: number;
  currentStreak: number;
  completedCourses: number;
  completedLessons: number;
  passedQuizzes: number;
}

export class AchievementService {
  async checkAndAward(userId: string): Promise<string[]> {
    // Gather user stats
    const [profile, completedEnrollments, completedLessons, passedQuizzes] = await Promise.all([
      prisma.profile.findUnique({ where: { userId }, select: { xp: true, level: true, currentStreak: true, longestStreak: true } }),
      prisma.enrollment.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.lessonProgress.count({ where: { userId, isCompleted: true } }),
      prisma.quizAttempt.count({ where: { userId, isPassed: true } }),
    ]);

    if (!profile) return [];

    const stats: AchievementCheck = {
      userId,
      xp: profile.xp,
      level: profile.level,
      currentStreak: profile.currentStreak,
      completedCourses: completedEnrollments,
      completedLessons,
      passedQuizzes,
    };

    // Get all achievements and already-earned ones
    const [allAchievements, earned] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({ where: { userId }, select: { achievementId: true } }),
    ]);

    const earnedIds = new Set(earned.map((e) => e.achievementId));
    const newlyEarned: string[] = [];

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue;

      const condition = JSON.parse(achievement.condition);
      if (this.meetsCondition(stats, condition)) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        });
        newlyEarned.push(achievement.nameAr || achievement.name);
      }
    }

    return newlyEarned;
  }

  private meetsCondition(stats: AchievementCheck, condition: Record<string, number>): boolean {
    for (const [key, value] of Object.entries(condition)) {
      switch (key) {
        case 'minXp': if (stats.xp < value) return false; break;
        case 'minLevel': if (stats.level < value) return false; break;
        case 'minStreak': if (stats.currentStreak < value) return false; break;
        case 'minCompletedCourses': if (stats.completedCourses < value) return false; break;
        case 'minCompletedLessons': if (stats.completedLessons < value) return false; break;
        case 'minPassedQuizzes': if (stats.passedQuizzes < value) return false; break;
      }
    }
    return true;
  }
}
