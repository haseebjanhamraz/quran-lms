import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument, RolePermission, RolePermissionDocument, Role } from '../schemas';

const MODULES = [
  'users', 'students', 'teachers', 'courses', 'schedule',
  'enrollments', 'fees', 'hr', 'supervisors', 'audit-logs', 'settings', 'feedback',
  'expenses', 'salary-config', 'support', 'reports', 'leave'
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

  async getUserPermissions(role: Role): Promise<string[]> {
    if (role === Role.SUPER_ADMIN) {
      await this.ensureAllModulePermissions();
      const all = await this.permissionModel.find();
      return all.map((p) => p.name);
    }
    const rps = await this.rolePermissionModel.find({ role }).populate('permission');
    const perms: string[] = [];
    for (const rp of rps) {
      const p = (rp as any).permission;
      if (p && p.name) perms.push(p.name);
    }

    // Default fallback permissions if role has no DB entries
    if (perms.length === 0) {
      if (role === Role.ADMIN) {
        await this.ensureAllModulePermissions();
        const all = await this.permissionModel.find();
        return all.map((p) => p.name);
      }
      if (role === Role.HR) {
        return [
          'fees.create', 'fees.read', 'fees.update', 'fees.delete',
          'hr.create', 'hr.read', 'hr.update', 'hr.delete',
          'expenses.create', 'expenses.read', 'expenses.update',
          'salary-config.create', 'salary-config.read', 'salary-config.update',
          'support.create', 'support.read', 'support.update', 'support.delete',
          'reports.read', 'students.read', 'teachers.read', 'enrollments.read'
        ];
      }
      if (role === Role.TEACHER) {
        return [
          'courses.read', 'schedule.read', 'schedule.create', 'schedule.update',
          'students.read', 'enrollments.read', 'feedback.create', 'feedback.read',
          'leave.create', 'leave.read'
        ];
      }
      if (role === Role.SUPERVISOR) {
        return [
          'courses.read', 'schedule.read', 'students.read',
          'supervisors.create', 'supervisors.read', 'feedback.create', 'feedback.read'
        ];
      }
      if (role === Role.STUDENT) {
        return [
          'courses.read', 'schedule.read', 'enrollments.read',
          'feedback.create', 'feedback.read', 'support.create', 'support.read'
        ];
      }
    }

    return perms;
  }

  async getMatrix() {
    await this.ensureAllModulePermissions();
    const permissions = await this.permissionModel.find().sort({ module: 1, action: 1 });
    const rolePermissions = await this.rolePermissionModel.find().populate('permission');

    const matrix: Record<string, Record<string, Record<string, boolean>>> = {};
    const roles = [Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.SUPERVISOR, Role.HR];

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

    // Default SUPER_ADMIN to all true unconditionally
    MODULES.forEach((mod) => {
      ACTIONS.forEach((act) => {
        matrix[Role.SUPER_ADMIN][mod][act] = true;
      });
    });

    // Default ADMIN in matrix ONLY if role has no DB entries yet
    const adminPermCount = await this.rolePermissionModel.countDocuments({ role: Role.ADMIN });
    if (adminPermCount === 0) {
      MODULES.forEach((mod) => {
        ACTIONS.forEach((act) => {
          matrix[Role.ADMIN][mod][act] = true;
        });
      });
    }

    // Default Teacher permissions in matrix if role has no DB entries
    const teacherPermCount = await this.rolePermissionModel.countDocuments({ role: Role.TEACHER });
    if (teacherPermCount === 0) {
      ['courses', 'schedule', 'students', 'enrollments', 'feedback', 'leave'].forEach((mod) => {
        if (matrix[Role.TEACHER][mod]) matrix[Role.TEACHER][mod]['read'] = true;
      });
      if (matrix[Role.TEACHER]['schedule']) {
        matrix[Role.TEACHER]['schedule']['create'] = true;
        matrix[Role.TEACHER]['schedule']['update'] = true;
      }
      if (matrix[Role.TEACHER]['feedback']) matrix[Role.TEACHER]['feedback']['create'] = true;
      if (matrix[Role.TEACHER]['leave']) {
        matrix[Role.TEACHER]['leave']['create'] = true;
        matrix[Role.TEACHER]['leave']['update'] = true;
      }
    }

    // Default HR permissions in matrix if role has no DB entries
    const hrPermCount = await this.rolePermissionModel.countDocuments({ role: Role.HR });
    if (hrPermCount === 0) {
      const hrDefaults = [
        'fees', 'hr', 'expenses', 'salary-config', 'support', 'reports'
      ];
      hrDefaults.forEach((mod) => {
        ACTIONS.forEach((act) => {
          if (matrix[Role.HR][mod]) matrix[Role.HR][mod][act] = true;
        });
      });
      if (matrix[Role.HR]['students']) matrix[Role.HR]['students']['read'] = true;
      if (matrix[Role.HR]['teachers']) matrix[Role.HR]['teachers']['read'] = true;
      if (matrix[Role.HR]['enrollments']) matrix[Role.HR]['enrollments']['read'] = true;
    }

    return { permissions, matrix };
  }

  async updateRoleBatch(role: Role, enabledPermissions: { module: string; action: string }[], grantedByUserId?: string) {
    if (role === Role.SUPER_ADMIN) {
      throw new ConflictException('Super Admin permissions are absolute and cannot be modified.');
    }
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
