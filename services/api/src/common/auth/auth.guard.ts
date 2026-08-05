import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { verifyToken } from '@ajac/auth';
import { PrismaService } from '../../prisma/prisma.service';
import { getAuthConfig } from './auth-config';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { AuthUser } from './auth-user.type';

interface AuthenticatedRequest {
  headers: Record<string, string | undefined>;
  user?: AuthUser;
}

/**
 * Global guard: requires a valid `Authorization: Bearer` access token on every
 * route except those marked `@Public()`. The user's roles and permissions are
 * reloaded from the database on each request so deactivation and permission
 * changes take effect immediately.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers?.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const { accessSecret } = getAuthConfig();
    let subject: string;
    try {
      const verified = await verifyToken(accessSecret, token);
      subject = verified.sub;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: subject, deletedAt: null, isActive: true },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: {
                name: true,
                permissions: { select: { permission: { select: { code: true } } } },
              },
            },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const roles = user.roles.map((r) => r.role.name);
    const permissions = [
      ...new Set(user.roles.flatMap((r) => r.role.permissions.map((p) => p.permission.code))),
    ];
    request.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles,
      permissions,
    };
    return true;
  }
}
