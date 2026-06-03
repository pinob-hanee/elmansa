import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const achievements = [
  {
    name: 'First Step',
    nameAr: 'الخطوة الأولى',
    description: 'Complete your first lesson',
    iconUrl: '🎯',
    condition: JSON.stringify({ minCompletedLessons: 1 }),
    points: 50,
  },
  {
    name: 'Quiz Starter',
    nameAr: 'بداية الاختبارات',
    description: 'Pass your first quiz',
    iconUrl: '📝',
    condition: JSON.stringify({ minPassedQuizzes: 1 }),
    points: 100,
  },
  {
    name: 'Course Graduate',
    nameAr: 'خريج الكورس',
    description: 'Complete your first course',
    iconUrl: '🎓',
    condition: JSON.stringify({ minCompletedCourses: 1 }),
    points: 500,
  },
  {
    name: 'Scholar',
    nameAr: 'العالم',
    description: 'Complete 5 courses',
    iconUrl: '📚',
    condition: JSON.stringify({ minCompletedCourses: 5 }),
    points: 1000,
  },
  {
    name: 'Week Warrior',
    nameAr: 'محارب الأسبوع',
    description: 'Maintain a 7-day streak',
    iconUrl: '🔥',
    condition: JSON.stringify({ minStreak: 7 }),
    points: 200,
  },
  {
    name: 'Monthly Legend',
    nameAr: 'أسطورة الشهر',
    description: 'Maintain a 30-day streak',
    iconUrl: '⚡',
    condition: JSON.stringify({ minStreak: 30 }),
    points: 1000,
  },
  {
    name: 'Rising Star',
    nameAr: 'النجم الصاعد',
    description: 'Reach Level 5',
    iconUrl: '⭐',
    condition: JSON.stringify({ minLevel: 5 }),
    points: 300,
  },
  {
    name: 'Master',
    nameAr: 'الأستاذ',
    description: 'Reach Level 10',
    iconUrl: '👑',
    condition: JSON.stringify({ minLevel: 10 }),
    points: 1000,
  },
  {
    name: 'Lesson Hunter',
    nameAr: 'صائد الدروس',
    description: 'Complete 50 lessons',
    iconUrl: '🏹',
    condition: JSON.stringify({ minCompletedLessons: 50 }),
    points: 500,
  },
  {
    name: 'Quiz Master',
    nameAr: 'سيد الاختبارات',
    description: 'Pass 20 quizzes',
    iconUrl: '🧠',
    condition: JSON.stringify({ minPassedQuizzes: 20 }),
    points: 500,
  },
];

async function seedAchievements() {
  console.log('Seeding achievements...');
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement,
    });
  }
  console.log(`✅ Seeded ${achievements.length} achievements`);
  await prisma.$disconnect();
}

seedAchievements().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
