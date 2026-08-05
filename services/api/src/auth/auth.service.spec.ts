import { describe, expect, it, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { hashPassword } from '@ajac/auth';
import type { PrismaService } from '../prisma/prisma.service';
import { hashRefreshToken } from './tokens';
import { AuthService } from './auth.service';

type Mock = ReturnType<typeof vi.fn>;

interface MockDb {
  user: Record<'findFirst' | 'findUnique' | 'update', Mock>;
  session: Record<'findUnique' | 'create' | 'update' | 'updateMany', Mock>;
  auditLog: Record<'create', Mock>;
  $transaction: Mock;
}

function makeService(): {
  service: AuthService;
  db: MockDb;
} {
  const user = { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() };
  const session = { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() };
  const auditLog = { create: vi.fn() };
  const db: MockDb = {
    user,
    session,
    auditLog,
    $transaction: vi.fn(async (ops: unknown) => Promise.all(ops as unknown[])),
  };
  const prisma = db as unknown as PrismaService;
  return { service: new AuthService(prisma), db };
}

function activeUser(): Record<string, unknown> {
  return {
    id: 'u1',
    email: 'admin@authenticja.com',
    firstName: 'Admin',
    lastName: 'User',
    passwordHash: 'stub',
    isActive: true,
    roles: [
      {
        role: {
          name: 'SUPER_ADMIN',
          permissions: [{ permission: { code: 'users.read' } }, { permission: { code: 'roles.write' } }],
        },
      },
    ],
  };
}

describe('AuthService', () => {
  it('logs in a valid user, persists a session hash, and returns tokens', async () => {
    const { service, db } = makeService();
    const passwordHash = await hashPassword('Password1');
    db.user.findFirst.mockResolvedValue({ ...activeUser(), passwordHash });
    db.session.create.mockResolvedValue({ id: 's1' });
    db.user.update.mockResolvedValue({});

    const result = await service.login(
      { email: 'admin@authenticja.com', password: 'Password1' },
      { ipAddress: '127.0.0.1', userAgent: 'test-agent' },
    );

    expect(db.session.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'u1',
        tokenHash: hashRefreshToken(result.refreshToken),
        expiresAt: expect.any(Date),
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      }),
    });
    expect(db.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { lastLoginAt: expect.any(Date) } }),
    );
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.expiresIn).toBe(900);
    expect(result.user.roles).toContain('SUPER_ADMIN');
    expect(result.user.permissions).toContain('roles.write');
  });

  it('never reveals whether the email exists (generic 401)', async () => {
    const { service, db } = makeService();
    db.user.findFirst.mockResolvedValue(null);
    await expect(
      service.login({ email: 'ghost@x.com', password: 'Password1' }, {}),
    ).rejects.toThrow('Invalid email or password');
  });

  it('rejects an inactive user with the generic 401', async () => {
    const { service, db } = makeService();
    const passwordHash = await hashPassword('Password1');
    db.user.findFirst.mockResolvedValue({ ...activeUser(), passwordHash, isActive: false });
    await expect(
      service.login({ email: 'admin@authenticja.com', password: 'Password1' }, {}),
    ).rejects.toThrow('Invalid email or password');
  });

  it('throttles after five failed attempts per email+ip', async () => {
    const { service, db } = makeService();
    db.user.findFirst.mockResolvedValue(null);
    const attempt = () =>
      service.login({ email: 'admin@authenticja.com', password: 'wrong' }, { ipAddress: '1.2.3.4' });

    for (let i = 0; i < 5; i++) {
      await expect(attempt()).rejects.toThrow('Invalid email or password');
    }
    await expect(attempt()).rejects.toThrow('Too many failed login attempts');
  });

  it('rotates the session on refresh and issues a fresh pair', async () => {
    const { service, db } = makeService();
    db.session.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      tokenHash: 'hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    db.user.findFirst.mockResolvedValue(activeUser());
    db.session.create.mockResolvedValue({ id: 's2' });
    db.session.update.mockResolvedValue({});

    const result = await service.refresh('raw-refresh-token', {});

    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { revokedAt: expect.any(Date) },
    });
    expect(db.session.create).toHaveBeenCalled();
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).not.toBe('raw-refresh-token');
  });

  it('revokes every session when an already-rotated token is reused', async () => {
    const { service, db } = makeService();
    db.session.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      tokenHash: 'hash',
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.refresh('stale-token', {})).rejects.toThrow('Invalid refresh token');
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('rejects an expired refresh token', async () => {
    const { service, db } = makeService();
    db.session.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      tokenHash: 'hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() - 60_000),
    });
    await expect(service.refresh('expired-token', {})).rejects.toThrow('Refresh token expired');
  });

  it('revokes the session on logout', async () => {
    const { service, db } = makeService();
    db.session.findUnique.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      tokenHash: 'hash',
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    db.session.update.mockResolvedValue({});

    await service.logout('raw-refresh-token', {});
    expect(db.session.update).toHaveBeenCalledWith({
      where: { id: 's1' },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('changes the password and revokes all sessions', async () => {
    const { service, db } = makeService();
    const passwordHash = await hashPassword('Current1');
    db.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });
    db.session.updateMany.mockResolvedValue({ count: 1 });
    db.user.update.mockResolvedValue({});

    await service.changePassword(
      'u1',
      { currentPassword: 'Current1', newPassword: 'NewPass1' },
      {},
    );

    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { passwordHash: expect.any(String) },
    });
    const hashArg = (db.user.update.mock.calls[0]?.[0] as { data: { passwordHash: string } }).data
      .passwordHash;
    expect(hashArg).not.toBe('NewPass1');
    expect(db.session.updateMany).toHaveBeenCalledWith({
      where: { userId: 'u1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('rejects change-password when the current password is wrong', async () => {
    const { service, db } = makeService();
    const passwordHash = await hashPassword('Current1');
    db.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash });
    await expect(
      service.changePassword('u1', { currentPassword: 'Wrong1', newPassword: 'NewPass1' }, {}),
    ).rejects.toThrow(UnauthorizedException);
  });
});
