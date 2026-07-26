import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { module: 'asc' },
    });
  }

  async findByRole(role: Role) {
    return this.prisma.rolePermission.findMany({
      where: { role },
      include: {
        permission: true,
      },
    });
  }

  async assignToRole(role: Role, permissionId: string, grantedByUserId: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Permission already assigned to role');
    }

    return this.prisma.rolePermission.create({
      data: {
        role,
        permissionId,
        grantedBy: grantedByUserId,
      },
    });
  }

  async revokeFromRole(role: Role, permissionId: string) {
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        role_permissionId: {
          role,
          permissionId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Permission not assigned to role');
    }

    return this.prisma.rolePermission.delete({
      where: { id: existing.id },
    });
  }

  async seedDefaultPermissions() {
    const permissions = [
      { name: 'users.create', description: 'Create users', module: 'users', action: 'create' },
      { name: 'users.read', description: 'Read users', module: 'users', action: 'read' },
      { name: 'users.update', description: 'Update users', module: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', module: 'users', action: 'delete' },
      { name: 'courses.create', description: 'Create courses', module: 'courses', action: 'create' },
      { name: 'courses.read', description: 'Read courses', module: 'courses', action: 'read' },
      { name: 'courses.update', description: 'Update courses', module: 'courses', action: 'update' },
      { name: 'courses.delete', description: 'Delete courses', module: 'courses', action: 'delete' },
      { name: 'sessions.create', description: 'Create sessions', module: 'sessions', action: 'create' },
      { name: 'sessions.read', description: 'Read sessions', module: 'sessions', action: 'read' },
      { name: 'sessions.update', description: 'Update sessions', module: 'sessions', action: 'update' },
      { name: 'sessions.delete', description: 'Delete sessions', module: 'sessions', action: 'delete' },
    ];

    for (const p of permissions) {
      await this.prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      });
    }

    return { message: 'Permissions seeded successfully' };
  }
}
