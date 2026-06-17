import { AuthService } from '../src/modules/auth/auth.service';
import { prisma } from '../src/config/database';
import { hashPassword, verifyPassword } from '../src/utils/hash';
import { ConflictError, UnauthorizedError } from '../src/utils/errors';

jest.mock('../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    emailVerification: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

jest.mock('../src/utils/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    verifyEmail: jest.fn(),
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictError if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1' });

      await expect(authService.register({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      } as any)).rejects.toThrow(ConflictError);
    });

    it('should hash password and create user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_password');
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: '2',
        email: 'new@test.com',
        role: 'STUDENT',
        approvalStatus: 'PENDING',
      });

      const result = await authService.register({
        email: 'new@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      } as any);

      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result.email).toBe('new@test.com');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError on invalid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.login({
        email: 'wrong@test.com',
        password: 'password',
        rememberMe: false
      })).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError on incorrect password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ passwordHash: 'hash' });
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.login({
        email: 'user@test.com',
        password: 'wrong_password',
        rememberMe: false
      })).rejects.toThrow(UnauthorizedError);
    });
  });
});
