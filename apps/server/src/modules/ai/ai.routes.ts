import { Router } from 'express';
import { aiService } from './ai.service';
import { authenticate } from '../../api/middlewares/auth.middleware';
import { successResponse } from '../../utils/response';
import { z } from 'zod';
import { validate } from '../../api/middlewares/validate.middleware';

const router = Router();

const chatSchema = z.object({
  body: z.object({
    message: z.string().min(1).max(2000),
    history: z.array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    ).optional()
  })
});

router.post('/chat', authenticate, validate(chatSchema), async (req, res, next) => {
  try {
    const { message, history } = req.body;
    const response = await aiService.chat(req.user!.userId, message, history);
    successResponse(res, response);
  } catch (err) {
    next(err);
  }
});

export default router;
