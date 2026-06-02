import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --------------------------------------------------------
  // Create Super Admin
  // --------------------------------------------------------
  const adminPassword = await argon2.hash('Admin@123456');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@elmansa.com' },
    update: {},
    create: {
      email: 'admin@elmansa.com',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      approvalStatus: 'APPROVED',
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
          language: 'ar',
        },
      },
    },
  });
  console.log('✅ Super Admin created:', admin.email);

  // --------------------------------------------------------
  // Create Teacher
  // --------------------------------------------------------
  const teacherPassword = await argon2.hash('Teacher@123456');
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@elmansa.com' },
    update: {},
    create: {
      email: 'teacher@elmansa.com',
      passwordHash: teacherPassword,
      role: 'TEACHER',
      approvalStatus: 'APPROVED',
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'أحمد',
          lastName: 'المدرس',
          language: 'ar',
        },
      },
    },
  });
  console.log('✅ Teacher created:', teacher.email);

  // --------------------------------------------------------
  // Create Categories
  // --------------------------------------------------------
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'mathematics' },
      update: {},
      create: { name: 'Mathematics', nameAr: 'الرياضيات', slug: 'mathematics', color: '#6366f1', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'science' },
      update: {},
      create: { name: 'Science', nameAr: 'العلوم', slug: 'science', color: '#10b981', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'arabic' },
      update: {},
      create: { name: 'Arabic', nameAr: 'اللغة العربية', slug: 'arabic', color: '#f59e0b', sortOrder: 3 },
    }),
  ]);
  console.log('✅ Categories created:', categories.length);

  // --------------------------------------------------------
  // Create Sample Course
  // --------------------------------------------------------
  const course = await prisma.course.upsert({
    where: { slug: 'mathematics-grade-12-2024' },
    update: {},
    create: {
      title: 'رياضيات الصف الثاني عشر 2024',
      slug: 'mathematics-grade-12-2024',
      description: 'كورس شامل لمنهج الرياضيات للصف الثاني عشر مع شرح مفصل لجميع الوحدات والنماذج الامتحانية',
      teacherId: teacher.id,
      categoryId: categories[0].id,
      level: 'INTERMEDIATE',
      price: 0,
      isPublished: true,
      modules: {
        create: [
          {
            title: 'الوحدة الأولى: الأعداد المركبة',
            sortOrder: 1,
            isPublished: true,
            chapters: {
              create: [
                {
                  title: 'الفصل الأول: مقدمة في الأعداد المركبة',
                  sortOrder: 1,
                  isPublished: true,
                  lessons: {
                    create: [
                      {
                        title: 'تعريف العدد المركب وأشكاله',
                        type: 'VIDEO',
                        sortOrder: 1,
                        isPublished: true,
                        isFree: true,
                        duration: 1800, // 30 min
                      },
                      {
                        title: 'العمليات الحسابية على الأعداد المركبة',
                        type: 'VIDEO',
                        sortOrder: 2,
                        isPublished: true,
                        duration: 2400,
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });
  console.log('✅ Sample course created:', course.title);

  // --------------------------------------------------------
  // Create Sample Student
  // --------------------------------------------------------
  const studentPassword = await argon2.hash('Student@123456');
  await prisma.user.upsert({
    where: { email: 'student@elmansa.com' },
    update: {},
    create: {
      email: 'student@elmansa.com',
      passwordHash: studentPassword,
      role: 'STUDENT',
      approvalStatus: 'APPROVED',
      isEmailVerified: true,
      profile: {
        create: {
          firstName: 'محمد',
          lastName: 'الطالب',
          grade: 'الصف الثاني عشر',
          school: 'مدرسة الأمل الثانوية',
          city: 'القاهرة',
          language: 'ar',
        },
      },
    },
  });
  console.log('✅ Sample student created');

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\nLogin credentials:');
  console.log('  Admin:   admin@elmansa.com   / Admin@123456');
  console.log('  Teacher: teacher@elmansa.com / Teacher@123456');
  console.log('  Student: student@elmansa.com / Student@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
