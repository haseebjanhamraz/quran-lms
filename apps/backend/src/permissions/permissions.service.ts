import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument, RolePermission, RolePermissionDocument, Role } from '../schemas';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
    @InjectModel(RolePermission.name) private readonly rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async findAll() {
    return this.permissionModel.find().sort({ module: 1 });
  }

  async findByRole(role: Role) {
    return this.rolePermissionModel.find({ role }).populate('permission');
  }

  async assignToRole(role: Role, permissionId: string, grantedByUserId: string) {
    const permission = await this.permissionModel.findById(permissionId);

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const existing = await this.rolePermissionModel.findOne({
      role,
      permissionId,
    });

    if (existing) {
      throw new ConflictException('Permission already assigned to role');
    }

    return this.rolePermissionModel.create({
      role,
      permissionId,
      grantedBy: grantedByUserId,
    });
  }

  async revokeFromRole(role: Role, permissionId: string) {
    const existing = await this.rolePermissionModel.findOne({
      role,
      permissionId,
    });

    if (!existing) {
      throw new NotFoundException('Permission not assigned to role');
    }

    return this.rolePermissionModel.findByIdAndDelete(existing._id);
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
      await this.permissionModel.findOneAndUpdate(
        { name: p.name },
        { $setOnInsert: p },
        { upsert: true, new: true },
      );
    }

    return { message: 'Permissions seeded successfully' };
  }
}
