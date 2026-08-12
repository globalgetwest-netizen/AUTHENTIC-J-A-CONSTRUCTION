import { Injectable, UnauthorizedException } from '@nestjs/common';
import { hashPassword, verifyPassword } from '@ajac/auth';
import { Prisma } from '@ajac/database';
import { PrismaService } from '../prisma/prisma.service';
import { getAuthConfig } from '../common/auth/auth-config';
import { recordAudit } from '../common/utils/audit';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { generateRefreshToken, hashRefreshToken, signAccessToken } from './tokens';

const USER_WITH_ROLES = {
  roles: {
    include: {
      role: {
        include: {
          permissions: { include: { permission: { select: { code: true } } } },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

type UserWithRoles = Prisma.UserGetPayload<{ include: typeof USER_WITH_ROLES }>;

export interface ClientMeta {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResult extends AuthTokens {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
  };
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class AuthService {
  // In-memory login throttle (resets on restart); Redis-backed hardening in Phase 22.
  private readonly loginThrottle = new Map<string, { count: number; lockedUntil: number }>();

  constructor(private readonly prisma: PrismaService) {}

  async login(dto: LoginDto, meta: ClientMeta): Promise<LoginResult> {
    // Lockout key: email when supplied, otherwise per-IP (password-only mode).
    const throttleKey = dto.email ?? meta.ipAddress ?? 'anonymous';

    this.assertNotThrottled(throttleKey, meta.ipAddress);

    // Resolve the user. When an email is provided we look up the single account
    // directly; otherwise (password-only sign-in) we match the password against
    // every active, non-deleted account and take the first hit.
    const user = dto.email
      ? await this.prisma.user.findFirst({
          where: { email: dto.email, deletedAt: null },
          include: USER_WITH_ROLES,
        })
      : await this.matchByPassword(dto.password);

    const passwordOk = user ? await verifyPassword(dto.password, user.passwordHash) : false;
    if (!user || !user.isActive || !passwordOk) {
      this.recordFailure(throttleKey, meta.ipAddress);
      await recordAudit(this.prisma, 'auth.login_failed', 'User', user?.id, { email: dto.email }, meta);
      throw new UnauthorizedException('Invalid email or password');
    }
    this.clearFailures(throttleKey, meta.ipAddress);

    const principal = rolesAndPermissions(user);
    const tokens = await this.issueTokens(user.id, principal, meta);
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordAudit(this.prisma, 'auth.login', 'User', user.id, undefined, { ...meta, actorId: user.id });
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: principal.roles,
        permissions: principal.permissions,
      },
    };
  }

  async refresh(refreshToken: string, meta: ClientMeta): Promise<AuthTokens> {
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });
    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.revokedAt) {
      // Reuse of an already-rotated token signals theft: revoke every session.
      await this.prisma.session.updateMany({
        where: { userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await recordAudit(this.prisma, 'auth.refresh_reuse', 'Session', session.id, undefined, meta);
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const user = await this.prisma.user.findFirst({
      where: { id: session.userId, deletedAt: null, isActive: true },
      include: USER_WITH_ROLES,
    });
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Rotation: revoke the presented session, issue a fresh pair.
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    const tokens = await this.issueTokens(user.id, rolesAndPermissions(user), meta);
    await recordAudit(this.prisma, 'auth.refresh', 'Session', session.id, undefined, { ...meta, actorId: user.id });
    return tokens;
  }

  async logout(refreshToken: string, meta: ClientMeta): Promise<void> {
    const tokenHash = hashRefreshToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });
    if (session && !session.revokedAt) {
      await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      await recordAudit(this.prisma, 'auth.logout', 'Session', session.id, undefined, { ...meta, actorId: session.userId });
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto, meta: ClientMeta): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const valid = await verifyPassword(dto.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    const newHash = await hashPassword(dto.newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } }),
      this.prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);
    await recordAudit(this.prisma, 'auth.change_password', 'User', userId, undefined, { ...meta, actorId: userId });
  }

  private async issueTokens(
    userId: string,
    principal: { roles: string[]; permissions: string[] },
    meta: ClientMeta,
  ): Promise<AuthTokens> {
    const config = getAuthConfig();
    const rawRefresh = generateRefreshToken();
    await this.prisma.session.create({
      data: {
        userId,
        tokenHash: hashRefreshToken(rawRefresh),
        expiresAt: new Date(Date.now() + config.refreshTtlSeconds * 1000),
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
      },
    });
    const accessToken = await signAccessToken(config, {
      id: userId,
      roles: principal.roles,
      permissions: principal.permissions,
    });
    return { accessToken, refreshToken: rawRefresh, expiresIn: config.accessTtlSeconds };
  }

  private assertNotThrottled(email: string, ip?: string): void {
    const entry = this.loginThrottle.get(this.loginKey(email, ip));
    if (entry && entry.lockedUntil > Date.now()) {
      throw new UnauthorizedException('Too many failed login attempts. Try again later.');
    }
  }

  private recordFailure(email: string, ip?: string): void {
    const key = this.loginKey(email, ip);
    const entry = this.loginThrottle.get(key);
    const now = Date.now();
    if (entry && entry.lockedUntil > now) {
      return;
    }
    const count = (entry?.count ?? 0) + 1;
    if (count >= MAX_FAILED_ATTEMPTS) {
      this.loginThrottle.set(key, { count: 0, lockedUntil: now + LOCK_WINDOW_MS });
    } else {
      this.loginThrottle.set(key, { count, lockedUntil: 0 });
    }
  }

  private clearFailures(email: string, ip?: string): void {
    this.loginThrottle.delete(this.loginKey(email, ip));
  }

  /**
   * Password-only lookup: iterate active, non-deleted accounts and return the
   * first whose stored hash verifies against the supplied password. We never
   * short-circuit on a miss, so the work done is independent of which (if any)
   * account matches — this avoids leaking which password is shared by how many
   * users. Returns null when nothing matches.
   */
  private async matchByPassword(password: string): Promise<UserWithRoles | null> {
    const candidates = await this.prisma.user.findMany({
      where: { deletedAt: null, isActive: true },
      include: USER_WITH_ROLES,
    });
    if (candidates.length === 0) return null;
    for (const candidate of candidates) {
      const ok = await verifyPassword(password, candidate.passwordHash);
      if (ok) return candidate;
    }
    return null;
  }

  private loginKey(email: string, ip?: string): string {
    return `${email.toLowerCase()}|${ip ?? ''}`;
  }
}

function rolesAndPermissions(user: UserWithRoles): { roles: string[]; permissions: string[] } {
  const roles = user.roles.map((r) => r.role.name);
  const permissions = [
    ...new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.permission.code))),
  ];
  return { roles, permissions };
}
