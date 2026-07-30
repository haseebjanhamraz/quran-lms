import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument, RolePermission, RolePermissionDocument, Role } from '../schemas';

const MODULES = [
  'users', 'students', 'teachers', 'courses', 'schedule',
  'enrollments', 'fees', 'hr', 'supervisors', 'audit-logs', 'settings', 'feedback'
];

const ACTIONS = ['create', 'read', 'update', 'delete'] as const;

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name) private readonly permissionModel: Model<PermissionDocument>,
    @InjectModel(RolePermission.name) private readonly rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async findAll() {
    await this.ensureAllModulePermissions();
    return this.permissionModel.find().sort({ module: 1, action: 1 });
  }

  async findByRole(role: Role) {
    return this.rolePermissionModel.find({ role }).populate('permission');
  }

  async getMatrix() {
    await this.ensureAllModulePermissions();
    const permissions = await this.permissionModel.find().sort({ module: 1, action: 1 });
    const rolePermissions = await this.rolePermissionModel.find().populate('permission');

    const matrix: Record<string, Record<string, Record<string, boolean>>> = {};
    const roles = [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.SUPERVISOR];

    roles.forEach((r) => {
      matrix[r] = {};
      MODULES.forEach((mod) => {
        matrix[r][mod] = { create: false, read: false, update: false, delete: false };
      });
    });

    // Populate matrix from database RolePermissions
    for (const rp of rolePermissions) {
      const perm = (rp as any).permission;
      if (perm && matrix[rp.role] && matrix[rp.role][perm.module]) {
        matrix[rp.role][perm.module][perm.action] = true;
      }
    }

    // Default ADMIN to all true if empty
    MODULES.forEach((mod) => {
      ACTIONS.forEach((act) => {
        matrix[Role.ADMIN][mod][act] = true;
      });
    });

    return { permissions, matrix };
  }

  async updateRoleBatch(role: Role, enabledPermissions: { module: string; action: string }[], grantedByUserId?: string) {
    // Fetch all permission docs
    const allPerms = await this.permissionModel.find();
    const permMap = new Map<string, string>(); // "module:action" -> permId
    allPerms.forEach((p) => permMap.set(`${p.module}:${p.action}`, p._id.toString()));

    // Target permission IDs to assign
    const targetPermIds: string[] = [];
    for (const item of enabledPermissions) {
      const id = permMap.get(`${item.module}:${item.action}`);
      if (id) targetPermIds.push(id);
    }

    // Wipe current role permissions for this role and re-insert target batch
    await this.rolePermissionModel.deleteMany({ role });

    const newDocs = targetPermIds.map((permissionId) => ({
      role,
      permissionId,
      grantedBy: grantedByUserId,
    }));

    if (newDocs.length > 0) {
      await this.rolePermissionModel.insertMany(newDocs);
    }

    return { message: `Permissions updated successfully for role ${role}`, count: newDocs.length };
  }

  async assignToRole(role: Role, permissionId: string, grantedByUserId: string) {
    const permission = await this.permissionModel.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    const existing = await this.rolePermissionModel.findOne({ role, permissionId });
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
    const existing = await this.rolePermissionModel.findOne({ role, permissionId });
    if (!existing) {
      throw new NotFoundException('Permission not assigned to role');
    }
    return this.rolePermissionModel.findByIdAndDelete(existing._id);
  }

  private async ensureAllModulePermissions() {
    for (const mod of MODULES) {
      for (const act of ACTIONS) {
        const name = `${mod}.${act}`;
        await this.permissionModel.findOneAndUpdate(
          { name },
          {
            $setOnInsert: {
              name,
              module: mod,
              action: act,
              description: `Can ${act} ${mod}`,
            },
          },
          { upsert: true, new: true }
        );
      }
    }
  }
}
