import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  private parseRole(roleStr: string): Role {
    if (!roleStr) throw new BadRequestException('Invalid role');
    const upper = roleStr.toUpperCase().trim();
    if (upper === 'REVIEWER') return Role.SUPERVISOR;
    const values = Object.values(Role) as string[];
    if (values.includes(upper)) {
      return upper as Role;
    }
    throw new BadRequestException(`Invalid role: ${roleStr}`);
  }

  @Get('matrix')
  @Roles(Role.ADMIN)
  getMatrix() {
    return this.permissionsService.getMatrix();
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll(@Query('matrix') matrix?: string) {
    if (matrix === 'true') {
      return this.permissionsService.getMatrix();
    }
    return this.permissionsService.findAll();
  }

  @Get('role/:role')
  @Roles(Role.ADMIN)
  findByRole(@Param('role') role: string) {
    const roleEnum = this.parseRole(role);
    return this.permissionsService.findByRole(roleEnum);
  }

  @Put('role/:role/batch')
  @Roles(Role.ADMIN)
  updateRoleBatch(
    @Param('role') role: string,
    @Body('enabledPermissions') enabledPermissions: { module: string; action: string }[],
    @CurrentUser() user: any,
  ) {
    const roleEnum = this.parseRole(role);
    return this.permissionsService.updateRoleBatch(roleEnum, enabledPermissions || [], user?.id);
  }

  @Post('role/:role/batch')
  @Roles(Role.ADMIN)
  postRoleBatch(
    @Param('role') role: string,
    @Body('enabledPermissions') enabledPermissions: { module: string; action: string }[],
    @CurrentUser() user: any,
  ) {
    const roleEnum = this.parseRole(role);
    return this.permissionsService.updateRoleBatch(roleEnum, enabledPermissions || [], user?.id);
  }

  @Post('role/:role/assign')
  @Roles(Role.ADMIN)
  assignToRole(
    @Param('role') role: string,
    @Body() assignPermissionDto: AssignPermissionDto,
    @CurrentUser() user: any,
  ) {
    const roleEnum = this.parseRole(role);
    return this.permissionsService.assignToRole(roleEnum, assignPermissionDto.permissionId, user?.id);
  }

  @Delete('role/:role/revoke/:permissionId')
  @Roles(Role.ADMIN)
  revokeFromRole(
    @Param('role') role: string,
    @Param('permissionId') permissionId: string,
  ) {
    const roleEnum = this.parseRole(role);
    return this.permissionsService.revokeFromRole(roleEnum, permissionId);
  }
}
