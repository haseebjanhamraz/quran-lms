import { Controller, Get, Post, Delete, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('role/:role')
  @Roles(Role.ADMIN)
  findByRole(@Param('role') role: string) {
    const roleEnum = Role[role as keyof typeof Role];
    if (!roleEnum) {
      throw new BadRequestException('Invalid role');
    }
    return this.permissionsService.findByRole(roleEnum);
  }

  @Post('role/:role/assign')
  @Roles(Role.ADMIN)
  assignToRole(
    @Param('role') role: string,
    @Body() assignPermissionDto: AssignPermissionDto,
    @CurrentUser() user: any,
  ) {
    const roleEnum = Role[role as keyof typeof Role];
    if (!roleEnum) {
      throw new BadRequestException('Invalid role');
    }
    return this.permissionsService.assignToRole(roleEnum, assignPermissionDto.permissionId, user.id);
  }

  @Delete('role/:role/revoke/:permissionId')
  @Roles(Role.ADMIN)
  revokeFromRole(
    @Param('role') role: string,
    @Param('permissionId') permissionId: string,
  ) {
    const roleEnum = Role[role as keyof typeof Role];
    if (!roleEnum) {
      throw new BadRequestException('Invalid role');
    }
    return this.permissionsService.revokeFromRole(roleEnum, permissionId);
  }
}
