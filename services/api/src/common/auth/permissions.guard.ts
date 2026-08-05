import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './require-permissions.decorator';
import type { AuthUser } from './auth-user.type';

/**
 * Global guard: enforces `@RequirePermissions(...)` metadata against the
 * authenticated user's permission set. Handlers without the decorator are
 * authenticated-only.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Permission denied');
    }
    if (!required.every((code) => user.permissions.includes(code))) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
