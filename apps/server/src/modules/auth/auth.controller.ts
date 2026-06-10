import { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env';
import { AuthService } from './auth.service';
import { successResponse, setRefreshTokenCookie, clearRefreshTokenCookie } from '../../utils/response';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = registerSchema.parse({ body: req.body });
      const user = await authService.register(body);
      successResponse(res, user, 'Registration successful. Please verify your email.', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = loginSchema.parse({ body: req.body });
      const deviceInfo = req.headers['user-agent'];
      const ipAddress = req.ip;
      const result = await authService.login(body, deviceInfo, ipAddress);
      setRefreshTokenCookie(res, result.refreshToken);
      successResponse(res, { accessToken: result.accessToken, user: result.user }, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        return next(new Error('No refresh token'));
      }
      const result = await authService.refreshToken(refreshToken);
      setRefreshTokenCookie(res, result.refreshToken);
      successResponse(res, { accessToken: result.accessToken }, 'Token refreshed');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      const accessToken = req.headers.authorization?.split(' ')[1];
      if (refreshToken && accessToken) {
        await authService.logout(refreshToken, accessToken);
      }
      clearRefreshTokenCookie(res);
      successResponse(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = verifyEmailSchema.parse({ query: req.query });
      await authService.verifyEmail(query.token);
      successResponse(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = forgotPasswordSchema.parse({ body: req.body });
      await authService.forgotPassword(body.email);
      successResponse(res, null, 'If this email exists, a reset link has been sent.');
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { body } = resetPasswordSchema.parse({ body: req.body });
      await authService.resetPassword(body.token, body.password);
      successResponse(res, null, 'Password reset successfully. Please log in.');
    } catch (error) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const googleUser = req.user as unknown as {
        googleId: string;
        email: string;
        firstName: string;
        lastName: string;
        avatarUrl?: string;
      };
      const result = await authService.googleCallback(
        googleUser.googleId,
        googleUser.email,
        googleUser.firstName,
        googleUser.lastName,
        googleUser.avatarUrl
      );
      setRefreshTokenCookie(res, result.refreshToken);
      // Redirect to frontend with token
      let clientUrl = env.CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:5173';
      if (!clientUrl.startsWith('http://') && !clientUrl.startsWith('https://')) {
        clientUrl = `https://${clientUrl}`;
      }
      res.redirect(
        `${clientUrl}/auth/callback?token=${result.accessToken}`
      );
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      // Update streak
      try {
        const { GamificationService } = await import('../gamification/gamification.service');
        const gamificationSvc = new GamificationService();
        await gamificationSvc.updateStreak(req.user!.userId);
      } catch (err) {
        // Silently fail gamification so auth is not broken
        console.error('Gamification streak error:', err);
      }

      const user = await import('../../config/database').then(({ prisma }) =>
        prisma.user.findUnique({
          where: { id: req.user!.userId },
          include: { profile: true },
          omit: { passwordHash: true },
        })
      );
      successResponse(res, user, 'User profile retrieved');
    } catch (error) {
      next(error);
    }
  }
}
