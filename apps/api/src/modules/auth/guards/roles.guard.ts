import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles && !requiredPermissions) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    if (requiredRoles) {
      const hasRole = requiredRoles.some((role) => user.roles?.includes(role));
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role');
      }
    }

    if (requiredPermissions) {
      const userPermissions =
        user.permissions?.map((perm: any) => perm.name) || [];
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.includes(permission),
      );
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}

