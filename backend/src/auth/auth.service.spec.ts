import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Prisma, User } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

interface CreateUserArgs {
  data: { email: string; name: string; passwordHash: string };
}

type PrismaUserMock = {
  create: jest.Mock<Promise<User>, [CreateUserArgs]>;
  findUnique: jest.Mock<Promise<User | null>, [unknown]>;
};

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'stored-hash',
    name: 'Người dùng Test',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AuthService', () => {
  let authService: AuthService;
  let prismaUser: PrismaUserMock;
  let jwtService: { sign: jest.Mock };

  beforeEach(() => {
    prismaUser = {
      create: jest.fn<Promise<User>, [CreateUserArgs]>(),
      findUnique: jest.fn<Promise<User | null>, [unknown]>(),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt-token') };

    const prisma = { user: prismaUser } as unknown as PrismaService;
    authService = new AuthService(prisma, jwtService as unknown as JwtService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('hash mật khẩu, tạo user và trả về accessToken + thông tin user', async () => {
      const created = buildUser({
        id: 'new-user',
        email: 'new@example.com',
        name: 'New User',
      });
      let createArg: CreateUserArgs | undefined;
      prismaUser.create.mockImplementation((args) => {
        createArg = args;
        return Promise.resolve(created);
      });

      const result = await authService.register({
        email: 'new@example.com',
        password: 'Password123!',
        name: 'New User',
      });

      expect(createArg?.data.email).toBe('new@example.com');
      expect(createArg?.data.name).toBe('New User');
      // Mật khẩu gốc không bao giờ được lưu/trả về trực tiếp.
      expect(createArg?.data.passwordHash).not.toBe('Password123!');
      expect(
        await bcrypt.compare(
          'Password123!',
          createArg?.data.passwordHash ?? '',
        ),
      ).toBe(true);

      expect(result).toEqual({
        accessToken: 'signed-jwt-token',
        user: { id: 'new-user', email: 'new@example.com', name: 'New User' },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'new-user',
        email: 'new@example.com',
      });
    });

    it('ném ConflictException khi email đã tồn tại (Prisma P2002)', async () => {
      prismaUser.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        authService.register({
          email: 'dup@example.com',
          password: 'Password123!',
          name: 'Dup',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('ném lại lỗi gốc nếu không phải lỗi trùng email', async () => {
      const otherError = new Error('DB down');
      prismaUser.create.mockRejectedValue(otherError);

      await expect(
        authService.register({
          email: 'x@example.com',
          password: 'Password123!',
          name: 'X',
        }),
      ).rejects.toBe(otherError);
    });
  });

  describe('login', () => {
    it('trả về accessToken khi email và mật khẩu đúng', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prismaUser.findUnique.mockResolvedValue(buildUser({ passwordHash }));

      const result = await authService.login({
        email: 'user@example.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user.email).toBe('user@example.com');
    });

    it('ném UnauthorizedException khi sai mật khẩu', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prismaUser.findUnique.mockResolvedValue(buildUser({ passwordHash }));

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('ném UnauthorizedException khi email không tồn tại', async () => {
      prismaUser.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'ghost@example.com',
          password: 'whatever123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('ném UnauthorizedException khi user chưa có passwordHash (chưa đặt mật khẩu)', async () => {
      prismaUser.findUnique.mockResolvedValue(
        buildUser({ passwordHash: null }),
      );

      await expect(
        authService.login({
          email: 'user@example.com',
          password: 'anything123',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getCurrentUser', () => {
    it('trả về thông tin user (không kèm passwordHash) khi tồn tại', async () => {
      prismaUser.findUnique.mockResolvedValue(buildUser());

      const result = await authService.getCurrentUser('user-1');

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Người dùng Test',
      });
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('ném UnauthorizedException khi user không còn tồn tại', async () => {
      prismaUser.findUnique.mockResolvedValue(null);

      await expect(
        authService.getCurrentUser('deleted-user'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
