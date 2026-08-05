import { describe, expect, it, vi } from 'vitest';
import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthUser } from './auth-user.type';
import { PermissionsGuard } from './permissions.guard';

function makeContext(user?: AuthUser): ExecutionContext {
  const handler = () => undefined;
  const cls = class TestController {};
  return {
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function makeGuard(required: string[] | undefined): PermissionsGuard {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(required),
  } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

function authUser(permissions: string[]): AuthUser {
  return {
    id: 'u1',
    email: 'a@b.com',
    firstName: 'A',
    lastName: 'B',
    isActive: true,
    roles: ['ADMIN'],
    permissions,
  };
}

describe('PermissionsGuard', () => {
  it('allows authenticated requests without permission metadata', () => {
    const guard = makeGuard(undefined);
    expect(guard.canActivate(makeContext(authUser([])))).toBe(true);
  });

  it('rejects when the request has no authenticated user', () => {
    const guard = makeGuard(['clients.read']);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(ForbiddenException);
  });

  it('rejects when the user is missing a required permission', () => {
    const guard = makeGuard(['clients.write']);
    expect(() => guard.canActivate(makeContext(authUser(['clients.read'])))).toThrow(
      ForbiddenException,
    );
  });

  it('allows when the user holds every required permission', () => {
    const guard = makeGuard(['clients.read', 'clients.write']);
    expect(guard.canActivate(makeContext(authUser(['clients.read', 'clients.write'])))).toBe(
      true,
    );
  });
});
