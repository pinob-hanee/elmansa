import { Router } from 'express';
import { AssignmentService } from './assignment.service';
import { authenticate, requireRole } from '../../api/middlewares/auth.middleware';
import { successResponse } from '../../utils/response';

const router = Router();
const svc = new AssignmentService();

// Admin: Upsert Assignment for a Lesson
router.put('/lessons/assignment', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const assignment = await svc.upsertAssignment(req.body.lessonId, req.body);
    successResponse(res, assignment, 'Assignment updated');
  } catch (e) { next(e); }
});

// Admin: Get all assignment submissions for grading
router.get('/admin/submissions', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const submissions = await svc.getAllSubmissions();
    successResponse(res, submissions);
  } catch (e) { next(e); }
});

// Admin: Grade submission
router.put('/admin/submissions/grade', authenticate, requireRole('TEACHER', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const submission = await svc.gradeSubmission(req.body.submissionId, req.user!.userId, req.body);
    successResponse(res, submission, 'Submission graded');
  } catch (e) { next(e); }
});

// Student: Get assignment details
router.get('/lessons/assignment', authenticate, async (req, res, next) => {
  try {
    const assignment = await svc.getAssignmentByLesson(req.query.lessonId as string);
    successResponse(res, assignment);
  } catch (e) { next(e); }
});

// Student: Submit assignment
router.post('/assignments/submit', authenticate, async (req, res, next) => {
  try {
    const submission = await svc.submitAssignment(req.body.assignmentId, req.user!.userId, req.body);
    successResponse(res, submission, 'Assignment submitted', 201);
  } catch (e) { next(e); }
});

// Student: Get own submissions
router.get('/users/me/submissions', authenticate, async (req, res, next) => {
  try {
    const submissions = await svc.getStudentSubmissions(req.user!.userId);
    successResponse(res, submissions);
  } catch (e) { next(e); }
});

export default router;
