import { Router } from 'express';
import passport from 'passport';
import { AuthController } from './auth.controller';
import { authenticate } from '../../api/middlewares/auth.middleware';
import { authLimiter } from '../../api/middlewares/rateLimiter.middleware';

const router = Router();
const ctrl = new AuthController();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       201:
 *         description: Registration successful
 */
router.post('/register', authLimiter, ctrl.register.bind(ctrl));
router.post('/login', authLimiter, ctrl.login.bind(ctrl));
router.post('/refresh', ctrl.refresh.bind(ctrl));
router.post('/logout', authenticate, ctrl.logout.bind(ctrl));
router.get('/verify-email', ctrl.verifyEmail.bind(ctrl));
router.post('/forgot-password', authLimiter, ctrl.forgotPassword.bind(ctrl));
router.post('/reset-password', authLimiter, ctrl.resetPassword.bind(ctrl));
router.get('/me', authenticate, ctrl.me.bind(ctrl));

import { env } from '../../config/env';

// Google OAuth Guard Middleware
const guardGoogleAuth = (req: any, res: any, next: any) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    res.status(501).json({
      success: false,
      message: 'Google OAuth is not configured on this server.',
    });
    return;
  }
  next();
};

router.get(
  '/google',
  guardGoogleAuth,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/google/callback',
  guardGoogleAuth,
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  ctrl.googleCallback.bind(ctrl)
);

export default router;
