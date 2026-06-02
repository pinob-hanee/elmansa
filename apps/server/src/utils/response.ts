import { Response } from 'express';
import { env } from '../config/env';

export const setRefreshTokenCookie = (res: Response, token: string): void => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/v1/auth/refresh',
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/api/v1/auth/refresh',
  });
};

export const successResponse = (
  res: Response,
  data: unknown,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const paginatedResponse = (
  res: Response,
  data: unknown,
  meta: { page: number; limit: number; total: number; totalPages: number },
  message = 'Success'
) => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
};
