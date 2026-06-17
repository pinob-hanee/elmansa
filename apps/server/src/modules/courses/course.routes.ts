import { Router } from 'express';
import { CourseService } from './course.service';
import { authenticate, requireRole, requireApprovedStudent, optionalAuthenticate } from '../../api/middlewares/auth.middleware';
import { successResponse, paginatedResponse } from '../../utils/response';
import { fileUpload } from '../media/media.service';
import { validate } from '../../api/middlewares/validate.middleware';
import { createCourseSchema, updateCourseSchema, createChapterSchema, createLessonSchema } from './course.schema';

const router = Router();
const svc = new CourseService();

// Public routes
router.get('/', async (req, res, next) => {
  try {
    const result = await svc.listCourses({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
      categoryId: req.query.categoryId as string,
      search: req.query.search as string,
      level: req.query.level as string,
      isFree: req.query.isFree === 'true' ? true : req.query.isFree === 'false' ? false : undefined,
      isPublished: true,
    });
    paginatedResponse(res, result.courses, result.meta);
  } catch (e) { next(e); }
});

router.get('/categories', async (_req, res, next) => {
  try {
    const cats = await svc.getCategories();
    successResponse(res, cats);
  } catch (e) { next(e); }
});

// Protected admin routes
router.get('/admin/list', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const result = await svc.listCourses({
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 12,
      search: req.query.search as string,
    });
    paginatedResponse(res, result.courses, result.meta);
  } catch (e) { next(e); }
});

// Protected routes
router.post('/', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), validate(createCourseSchema), async (req, res, next) => {
  try {
    const course = await svc.createCourse(req.user!.userId, req.body);
    successResponse(res, course, 'Course created', 201);
  } catch (e) { next(e); }
});

router.put('/:id', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), validate(updateCourseSchema), async (req, res, next) => {
  try {
    const course = await svc.updateCourse(req.params.id, req.user!.userId, req.body);
    successResponse(res, course, 'Course updated');
  } catch (e) { next(e); }
});

router.delete('/:id', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    await svc.deleteCourse(req.params.id, req.user!.userId, req.user!.role);
    successResponse(res, null, 'Course deleted');
  } catch (e) { next(e); }
});

// Admin: get full course detail including unpublished content
router.get('/:id/admin', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const course = await svc.getFullCourseForAdmin(req.params.id);
    successResponse(res, course);
  } catch (e) { next(e); }
});

// Curriculum Routes
router.post('/:id/modules', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const module = await svc.createModule(req.params.id, req.body);
    successResponse(res, module, 'Module created', 201);
  } catch (e) { next(e); }
});

router.post('/modules/:moduleId/chapters', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), validate(createChapterSchema), async (req, res, next) => {
  try {
    const chapter = await svc.createChapter(req.params.moduleId, req.body);
    successResponse(res, chapter, 'Chapter created', 201);
  } catch (e) { next(e); }
});

router.put('/chapters/:chapterId/deadline', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const chapter = await svc.updateChapterDeadline(req.params.chapterId, req.body.deadline ? new Date(req.body.deadline) : null);
    successResponse(res, chapter, 'Chapter deadline updated');
  } catch (e) { next(e); }
});

router.get('/chapters/:chapterId/student-deadlines', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const deadlines = await svc.getStudentDeadlinesForChapter(req.params.chapterId);
    successResponse(res, deadlines);
  } catch (e) { next(e); }
});

router.post('/chapters/:chapterId/student-deadlines', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const deadlineDate = req.body.deadline ? new Date(req.body.deadline) : null;
    const deadline = await svc.setStudentDeadline(req.params.chapterId, req.body.userId, deadlineDate);
    successResponse(res, deadline, 'Student deadline updated');
  } catch (e) { next(e); }
});

router.patch('/chapters/:chapterId/move', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const updated = await svc.moveChapter(req.params.chapterId, req.body.moduleId);
    successResponse(res, updated, 'Chapter moved');
  } catch (e) { next(e); }
});

router.delete('/chapters/:chapterId', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    await svc.deleteChapter(req.params.chapterId);
    successResponse(res, null, 'Chapter deleted');
  } catch (e) { next(e); }
});

router.post('/chapters/:chapterId/lessons', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), validate(createLessonSchema), async (req, res, next) => {
  try {
    const lesson = await svc.createLesson(req.params.chapterId, req.body);
    successResponse(res, lesson, 'Lesson created', 201);
  } catch (e) { next(e); }
});

router.put('/lessons/:lessonId', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const lesson = await svc.updateLesson(req.params.lessonId, req.body);
    successResponse(res, lesson, 'Lesson updated');
  } catch (e) { next(e); }
});

router.delete('/lessons/:lessonId', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    await svc.deleteLesson(req.params.lessonId);
    successResponse(res, null, 'Lesson deleted');
  } catch (e) { next(e); }
});

router.put('/chapters/:chapterId/lessons/reorder', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { lessonIds } = req.body;
    await svc.reorderLessons(req.params.chapterId, lessonIds);
    successResponse(res, null, 'Lessons reordered');
  } catch (e) { next(e); }
});

router.post('/:id/enroll', authenticate, requireApprovedStudent, async (req, res, next) => {
  try {
    const enrollment = await svc.enrollStudent(req.params.id, req.user!.userId);
    successResponse(res, enrollment, 'Enrollment request submitted', 201);
  } catch (e) { next(e); }
});

// Video URL (signed) or Lesson Content
router.get('/lessons/:lessonId/video', authenticate, requireApprovedStudent, async (req, res, next) => {
  try {
    const data = await svc.getLessonVideoUrl(req.params.lessonId, req.user!.userId);
    successResponse(res, data);
  } catch (e) { next(e); }
});

// Progress tracking
router.post('/lessons/:lessonId/progress', authenticate, requireApprovedStudent, async (req, res, next) => {
  try {
    const progress = await svc.updateLessonProgress(
      req.params.lessonId,
      req.user!.userId,
      req.body.watchedTime
    );
    successResponse(res, progress);
  } catch (e) { next(e); }
});

// Public slug route (must be last to avoid intercepting other routes)
router.get('/:slug', optionalAuthenticate, async (req, res, next) => {
  try {
    const course = await svc.getCourseBySlug(req.params.slug, req.user?.userId);
    successResponse(res, course);
  } catch (e) { next(e); }
});

export default router;
