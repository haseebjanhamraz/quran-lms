import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../schemas';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { PermissionsService } from '../../permissions/permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User authentication session is missing');
    }

    // Admin bypasses granular permission checks
    if (user.role === Role.ADMIN) {
      return true;
    }

    const userPermissions = await this.permissionsService.getUserPermissions(user.role);

    const hasAll = requiredPermissions.every((perm) =>
      userPermissions.includes(perm) || userPermissions.includes(perm.split('.')[0] + '.*')
    );

    if (!hasAll) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}
