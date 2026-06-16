import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, JwtPayload } from '@pet/shared';
import { ADMIN_ROLES_KEY } from '../decorators/require-admin-roles.decorator';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    const adminRole = user.role as AdminRole;

    if (adminRole === AdminRole.SUPER_ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(adminRole)) {
      throw new ForbiddenException('Insufficient admin permissions');
    }

    return true;
  }
}
