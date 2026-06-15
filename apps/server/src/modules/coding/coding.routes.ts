import { Router } from 'express';
import { authenticate, requireRole } from '../../api/middlewares/auth.middleware';
import { successResponse, paginatedResponse } from '../../utils/response';
import { CodingService } from './coding.service';

const router = Router();
const svc = new CodingService();

// ── Public / Student Routes ──────────────────────────────────────────

// List published problems
router.get('/problems', authenticate, async (req, res, next) => {
  try {
    const { courseId, difficulty, search, page, limit } = req.query as any;
    const result = await svc.getProblems({
      courseId,
      difficulty,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
    res.json({ success: true, ...result });
  } catch (e) { next(e); }
});

// Get single problem (strips hidden test cases)
router.get('/problems/:id', authenticate, async (req, res, next) => {
  try {
    const data = await svc.getProblemById(req.params.id, req.user!.userId);
    successResponse(res, data);
  } catch (e) { next(e); }
});

// Submit code for execution
router.post('/problems/:id/submit', authenticate, async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const result = await svc.submitCode(
      req.params.id,
      req.user!.userId,
      code,
      language
    );
    successResponse(res, result, 'Submission received', 202);
  } catch (e) { next(e); }
});

// Run code against visible test cases only (no submission saved)
router.post('/problems/:id/run', authenticate, async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const result = await svc.runCode(req.params.id, code, language);
    successResponse(res, result);
  } catch (e) { next(e); }
});

// Poll submission result
router.get('/submissions/:submissionId', authenticate, async (req, res, next) => {
  try {
    const data = await svc.getSubmission(req.params.submissionId, req.user!.userId);
    successResponse(res, data);
  } catch (e) { next(e); }
});

// Get my submissions for a problem
router.get('/problems/:id/my-submissions', authenticate, async (req, res, next) => {
  try {
    const data = await svc.getMySubmissions(req.params.id, req.user!.userId);
    successResponse(res, data);
  } catch (e) { next(e); }
});

// ── Admin Routes ──────────────────────────────────────────────────────

router.get(
  '/admin/problems',
  authenticate,
  requireRole('SUPER_ADMIN', 'TEACHER'),
  async (req, res, next) => {
    try {
      const { courseId, search } = req.query as any;
      const data = await svc.getAdminProblems({ courseId, search });
      successResponse(res, data);
    } catch (e) { next(e); }
  }
);

router.post(
  '/admin/problems',
  authenticate,
  requireRole('SUPER_ADMIN', 'TEACHER'),
  async (req, res, next) => {
    try {
      const data = await svc.createProblem(req.body);
      successResponse(res, data, 'Problem created', 201);
    } catch (e) { next(e); }
  }
);

router.put(
  '/admin/problems/:id',
  authenticate,
  requireRole('SUPER_ADMIN', 'TEACHER'),
  async (req, res, next) => {
    try {
      const data = await svc.updateProblem(req.params.id, req.body);
      successResponse(res, data, 'Problem updated');
    } catch (e) { next(e); }
  }
);

router.delete(
  '/admin/problems/:id',
  authenticate,
  requireRole('SUPER_ADMIN', 'TEACHER'),
  async (req, res, next) => {
    try {
      await svc.deleteProblem(req.params.id);
      successResponse(res, null, 'Problem deleted');
    } catch (e) { next(e); }
  }
);

export default router;
