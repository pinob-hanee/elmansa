import { prisma } from '../../config/database';
import { hashPassword, verifyPassword } from '../../utils/hash';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
} from '../../utils/jwt';
import { sendEmail, emailTemplates } from '../../utils/email';
import { env } from '../../config/env';
import { v4 as uuidv4 } from 'uuid';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../utils/errors';
import type { RegisterInput, LoginInput } from './auth.schema';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError('Email is already registered');

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: 'STUDENT',
        isEmailVerified: false,
        profile: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            grade: input.grade,
            school: input.school,
            city: input.city,
          },
        },
      },
      include: { profile: true },
    });

    // Create email verification token
    const verificationToken = uuidv4();
    await prisma.emailVerification.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    // Send verification email
    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    const template = emailTemplates.verifyEmail(input.firstName, verifyUrl);
    await sendEmail({ to: user.email, ...template }).catch(() => {
      /* non-blocking */
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile,
    };
  }

  async login(input: LoginInput, deviceInfo?: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      include: { profile: true },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await verifyPassword(user.passwordHash, input.password);
    if (!isValid) throw new UnauthorizedError('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedError('Account is deactivated');

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    const expiresAt = input.rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
        deviceInfo,
        ipAddress,
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        profile: user.profile,
      },
    };
  }

  async refreshToken(token: string) {
    const payload = verifyRefreshToken(token);

    const storedToken = await prisma.refreshToken.findUnique({ where: { token } });
    if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) throw new UnauthorizedError('Account not found');

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { token }, data: { isRevoked: true } });

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: storedToken.expiresAt,
        deviceInfo: storedToken.deviceInfo,
        ipAddress: storedToken.ipAddress,
      },
    });

    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string, accessToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
    await blacklistToken(accessToken);
  }

  async verifyEmail(token: string) {
    const record = await prisma.emailVerification.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired verification token');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      prisma.emailVerification.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent fail for security

    const token = uuidv4();
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;
    const name = (await prisma.profile.findUnique({ where: { userId: user.id } }))?.firstName || 'User';
    const template = emailTemplates.passwordReset(name, resetUrl);
    await sendEmail({ to: user.email, ...template }).catch(() => {});
  }

  async resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordReset.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all refresh tokens on password reset
      prisma.refreshToken.updateMany({
        where: { userId: record.userId },
        data: { isRevoked: true },
      }),
    ]);
  }

  async googleCallback(googleId: string, email: string, firstName: string, lastName: string, avatarUrl?: string) {
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId,
          isEmailVerified: true,
          role: 'STUDENT',
          profile: {
            create: { firstName, lastName, avatarUrl },
          },
        },
        include: { profile: true },
      });
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, isEmailVerified: true },
        include: { profile: true },
      });
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken, user };
  }
}
