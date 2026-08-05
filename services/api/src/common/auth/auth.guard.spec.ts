import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { signToken } from '@ajac/auth';
import type { PrismaService } from '../../prisma/prisma.service';
import { getAuthConfig } from './auth-config';
import type { AuthUser } from './auth-user.type';
import { AuthGuard } from './auth.guard';

function makeContext(request: {
  headers: Record<string, string | undefined>;
  user?: AuthUser;
}): ExecutionContext {
  const handler = () => undefined;
  const cls = class TestController {};
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function makeGuard(isPublic: boolean): {
  guard: AuthGuard;
  findUser: ReturnType<typeof vi.fn>;
} {
  const reflector = { getAllAndOverride: vi.fn().mockReturnValue(isPublic) } as unknown as Reflector;
  const findUser = vi.fn();
  const prisma = { user: { findFirst: findUser } } as unknown as PrismaService;
  return { guard: new AuthGuard(reflector, prisma), findUser };
}

function activeUserRow(): Record<string, unknown> {
  return {
    id: 'u1',
    email: 'a@b.com',
    firstName: 'A',
    lastName: 'B',
    isActive: true,
    roles: [
      {
        role: {
          name: 'ADMIN',
          permissions: [{ permission: { code: 'clients.read' } }],
        },
      },
    ],
  };
}

describe('AuthGuard', () => {
  it('bypasses authentication for @Public routes', async () => {
    const { guard, findUser } = makeGuard(true);
    const request = { headers: {} };
    const ok = await guard.canActivate(makeContext(request));
    expect(ok).toBe(true);
    expect(findUser).not.toHaveBeenCalled();
  });

  it('rejects a missing Authorization header with 401', async () => {
    const { guard } = makeGuard(false);
    const request = { headers: {} };
    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(
      'Authentication required',
    );
  });

  it('rejects an invalid token with 401', async () => {
    const { guard } = makeGuard(false);
    const request = { headers: { authorization: 'Bearer not-a-jwt' } };
    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a valid token for a deactivated or deleted user', async () => {
    const { guard, findUser } = makeGuard(false);
    const config = getAuthConfig();
    const token = await signToken(config.accessSecret, 'u1', {}, 900);
    const request = { headers: { authorization: `Bearer ${token}` } };
    findUser.mockResolvedValue(null);

    await expect(guard.canActivate(makeContext(request))).rejects.toThrow(
      'User not found or inactive',
    );
  });

  it('loads roles and permissions from the database and attaches AuthUser', async () => {
    const { guard, findUser } = makeGuard(false);
    const config = getAuthConfig();
    const token = await signToken(config.accessSecret, 'u1', {}, 900);
    const request: { headers: Record<string, string | undefined>; user?: AuthUser } = {
      headers: { authorization: `Bearer ${token}` },
    };
    findUser.mockResolvedValue(activeUserRow());

    const ok = await guard.canActivate(makeContext(request));

    expect(ok).toBe(true);
    expect(request.user?.roles).toEqual(['ADMIN']);
    expect(request.user?.permissions).toContain('clients.read');
    expect(findUser).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1', deletedAt: null, isActive: true } }),
    );
  });
});
