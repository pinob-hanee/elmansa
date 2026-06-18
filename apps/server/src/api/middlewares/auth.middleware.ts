import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isTokenBlacklisted } from '../../utils/jwt';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors';
import { prisma } from '../../config/database';
import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      role: Role;
    }
    // req.user is automatically typed as Express.User | undefined by Express
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (await isTokenBlacklisted(token)) {
      throw new UnauthorizedError('Token has been invalidated');
    }

    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true, isEmailVerified: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Account not found or inactive');
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (await isTokenBlacklisted(token)) {
      return next();
    }

    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (user && user.isActive) {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };
    }
    next();
  } catch (error) {
    next(); // Ignore errors and proceed as unauthenticated
  }
};

export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
};

export const requireVerifiedStudent = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) throw new UnauthorizedError();

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isEmailVerified: true, role: true },
    });

    if (!user) throw new UnauthorizedError();

    // Admins, Teachers, Moderators bypass approval check
    if (['SUPER_ADMIN', 'TEACHER', 'MODERATOR'].includes(user.role)) {
      return next();
    }

    if (!user.isEmailVerified) {
      return next(new ForbiddenError('Your account email is not verified yet.'));
    }

    next();
  } catch (error) {
    next(error);
  }
};
