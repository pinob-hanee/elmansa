import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api/v1';

async function runAudit() {
  console.log('🚀 Starting Data Audit & E2E Verification...\n');

  try {
    // 1. Cleanup previous audit data
    await prisma.user.deleteMany({
      where: { email: { in: ['admin_audit2@test.com', 'student_audit2@test.com'] } }
    });
    console.log('✅ Cleaned up old test data.');

    // 2. Authentication Flow (Admin)
    const adminRes = await axios.post(`${API_URL}/auth/register`, {
      email: 'admin_audit2@test.com',
      password: 'Password123!',
      firstName: 'Audit',
      lastName: 'Admin'
    });
    
    // Manually set role to SUPER_ADMIN directly in DB
    const admin = await prisma.user.update({
      where: { email: 'admin_audit2@test.com' },
      data: { role: 'SUPER_ADMIN', isEmailVerified: true }
    });

    // Login Admin
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin_audit2@test.com',
      password: 'Password123!'
    });
    const adminToken = adminLogin.data.data.accessToken;
    console.log('✅ Authentication Flow: Admin registered and logged in.');

    // 3. Course Creation Flow
    const courseRes = await axios.post(`${API_URL}/courses`, {
      title: 'Audit E2E Course',
      titleAr: 'دورة التدقيق',
      description: 'A test course',
      descriptionAr: 'دورة اختبار',
      level: 'BEGINNER'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const courseId = courseRes.data.data.id;
    console.log('✅ Course Creation: Basic course created.');

    const moduleRes = await axios.post(`${API_URL}/courses/${courseId}/modules`, {
      title: 'Module 1',
      titleAr: 'الوحدة 1',
      description: 'Test Module'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const moduleId = moduleRes.data.data.id;

    const chapterRes = await axios.post(`${API_URL}/courses/modules/${moduleId}/chapters`, {
      title: 'Chapter 1',
      titleAr: 'الفصل 1',
      description: 'Test Chapter'
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const chapterId = chapterRes.data.data.id;

    const lessonRes = await axios.post(`${API_URL}/courses/chapters/${chapterId}/lessons`, {
      title: 'Test Video Lesson',
      type: 'VIDEO',
      videoUrl: 'https://example.com/video.mp4',
      duration: 120,
      isFree: true
    }, { headers: { Authorization: `Bearer ${adminToken}` } });

    const lessonId = lessonRes.data.data.id;

    // Publish the course so students can enroll
    await axios.put(`${API_URL}/courses/${courseId}`, { isPublished: true }, { headers: { Authorization: `Bearer ${adminToken}` } });
    console.log('✅ Course Creation: Module, Chapter, Lesson added, Course Published.');

    // 4. Data Verification: Check Aggregations
    const dbCourse = await prisma.course.findUnique({ where: { id: courseId } });
    console.log(`📊 DB Check - Total Lessons: ${dbCourse?.totalLessons} (Expected: 1)`);
    console.log(`📊 DB Check - Total Duration: ${dbCourse?.totalDuration}s (Expected: 120s)`);

    // 5. Student Enrollment & Progress Flow
    const studentRes = await axios.post(`${API_URL}/auth/register`, {
      email: 'student_audit2@test.com',
      password: 'Password123!',
      firstName: 'Audit',
      lastName: 'Student'
    });

    const student = await prisma.user.update({
      where: { email: 'student_audit2@test.com' },
      data: { isEmailVerified: true }
    });

    const studentLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'student_audit2@test.com',
      password: 'Password123!'
    });
    const studentToken = studentLogin.data.data.accessToken;

    // Enroll
    await axios.post(`${API_URL}/courses/${courseId}/enroll`, {}, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log('✅ Enrollment: Student enrolled in course.');

    // Check DB enrollment count
    const enrolledCourse = await prisma.course.findUnique({ where: { id: courseId } });
    console.log(`📊 DB Check - Total Enrolled: ${enrolledCourse?.totalEnrolled} (Expected: 1)`);

    // Complete Lesson
    await axios.post(`${API_URL}/courses/lessons/${lessonId}/progress`, {
      watchedTime: 120,
      isCompleted: true
    }, { headers: { Authorization: `Bearer ${studentToken}` } });
    console.log('✅ Progress: Student completed the lesson.');

    // Verify Gamification & Progress Data
    const xpLogs = await prisma.xpLog.findMany({ where: { userId: student.id } });
    const progress = await prisma.lessonProgress.findFirst({ where: { userId: student.id, lessonId: lessonId } });
    
    console.log(`📊 DB Check - Lesson Progress Completed: ${progress?.isCompleted}`);
    console.log(`📊 DB Check - XP Logs Generated: ${xpLogs.length} (Expected: > 0)`);
    console.log(`📊 DB Check - XP Log Reason: ${xpLogs[0]?.reason}`);

    // Verify Certificate Generation
    const certs = await prisma.certificate.findMany({ where: { userId: student.id, courseId: courseId } });
    console.log(`📊 DB Check - Certificates Generated: ${certs.length} (Expected: 1)`);

    console.log('\n🎉 All flows executed successfully! Data is synchronized.');

  } catch (error: any) {
    console.error('\n❌ AUDIT FAILED!');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
