import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { redis } from '../config/redis';
import { UnauthorizedError } from './errors';

export interface JwtPayload {
  userId: string;
  role: string;
  email: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as JwtPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
};

// Blacklist a token (logout, rotation)
export const blacklistToken = async (token: string, ttlSeconds = 900): Promise<void> => {
  try {
    if (redis) await redis.set(`bl:${token}`, '1', 'EX', ttlSeconds);
  } catch { /* silent — degraded mode */ }
};

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  try {
    if (!redis) return false;
    const val = await redis.get(`bl:${token}`);
    return val !== null;
  } catch { return false; }
};
