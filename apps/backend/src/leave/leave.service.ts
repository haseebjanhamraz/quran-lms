import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LeaveRequest, LeaveRequestDocument, LeaveStatus, LeaveType,
  LeaveBalance, LeaveBalanceDocument,
  User, UserDocument, Role, AccountStatus,
  NotificationType,
} from '../schemas';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ReviewLeaveRequestDto } from './dto/review-leave-request.dto';
import { UpdateLeaveBalanceDto } from './dto/update-leave-balance.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class LeaveService {
  private readonly logger = new Logger(LeaveService.name);

  constructor(
    @InjectModel(LeaveRequest.name)
    private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveBalance.name)
    private readonly leaveBalanceModel: Model<LeaveBalanceDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly scheduleGateway: ScheduleGateway,
    private readonly cacheService: RedisCacheService,
  ) {}

  // 1. Get or create balance for teacher in a specific year
  async getOrCreateBalance(teacherId: string, year: number = new Date().getFullYear()): Promise<LeaveBalanceDocument> {
    let balance = await this.leaveBalanceModel.findOne({ teacherId, year });
    if (!balance) {
      balance = await this.leaveBalanceModel.create({
        teacherId,
        year,
        allocated: { sick: 10, casual: 12, annual: 15, other: 5 },
        used: { sick: 0, casual: 0, annual: 0, other: 0 },
      });
    }
    return balance;
  }

  // 2. Submit Leave Request (Teacher)
  async createLeaveRequest(teacherId: string, dto: CreateLeaveRequestDto): Promise<any> {
    const teacher = await this.userModel.findById(teacherId);
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Teacher not found');
    }

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid start or end date');
    }
    if (end < start) {
      throw new BadRequestException('End date cannot be earlier than start date');
    }

    // Calculate total days (inclusive)
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = Math.max(1, diffDays);

    const year = start.getFullYear();
    const balance = await this.getOrCreateBalance(teacherId, year);

    const typeKey = dto.leaveType.toLowerCase() as keyof typeof balance.allocated;
    const allocated = balance.allocated[typeKey] ?? 0;
    const used = balance.used[typeKey] ?? 0;
    const remaining = allocated - used;

    const newRequest = await this.leaveRequestModel.create({
      teacherId,
      leaveType: dto.leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: dto.reason,
      status: LeaveStatus.PENDING,
    });

    const populated: any = await this.leaveRequestModel.findById(newRequest._id)
      .populate('teacher', 'id name email profilePicture')
      .lean();

    // Notify all admins about new leave request
    const admins = await this.userModel.find({
      role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] },
      isActive: true,
    }).select('_id');

    for (const admin of admins) {
      await this.notificationsService.createNotification(
        admin._id.toString(),
        'New Leave Request Submitted',
        `${teacher.name} has requested ${totalDays} day(s) of ${dto.leaveType} leave.`,
        NotificationType.LEAVE_REQUESTED,
        { leaveId: newRequest._id.toString(), teacherId },
      );
    }

    // Invalidate caches
    await this.cacheService.del(`leave:my:${teacherId}`);
    await this.cacheService.delByPattern('leave:stats:*');
    await this.cacheService.delByPattern(`stats:teacher:${teacherId}`);

    // Realtime broadcast & targeted admin notify
    this.scheduleGateway.broadcastLeaveUpdate('LEAVE_REQUESTED', populated, teacherId);
    this.scheduleGateway.sendToRoles(['ADMIN', 'SUPER_ADMIN'], 'new_leave_request', populated);

    return {
      ...populated,
      balanceInfo: {
        allocated,
        used,
        remaining,
      },
    };
  }

  // 3. Get my leaves (Teacher)
  async getTeacherLeaves(teacherId: string, status?: LeaveStatus): Promise<any> {
    const query: any = { teacherId };
    if (status) query.status = status;

    return this.leaveRequestModel.find(query)
      .populate('reviewer', 'id name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  // 4. Get teacher leave balance with remaining calculation
  async getTeacherBalance(teacherId: string, year: number = new Date().getFullYear()): Promise<any> {
    const balance = await this.getOrCreateBalance(teacherId, year);
    const balanceObj = balance.toObject();

    const remaining = {
      sick: Math.max(0, (balanceObj.allocated?.sick || 0) - (balanceObj.used?.sick || 0)),
      casual: Math.max(0, (balanceObj.allocated?.casual || 0) - (balanceObj.used?.casual || 0)),
      annual: Math.max(0, (balanceObj.allocated?.annual || 0) - (balanceObj.used?.annual || 0)),
      other: Math.max(0, (balanceObj.allocated?.other || 0) - (balanceObj.used?.other || 0)),
    };

    const totalAllocated = (balanceObj.allocated?.sick || 0) + (balanceObj.allocated?.casual || 0) + (balanceObj.allocated?.annual || 0) + (balanceObj.allocated?.other || 0);
    const totalUsed = (balanceObj.used?.sick || 0) + (balanceObj.used?.casual || 0) + (balanceObj.used?.annual || 0) + (balanceObj.used?.other || 0);
    const totalRemaining = Math.max(0, totalAllocated - totalUsed);

    return {
      ...balanceObj,
      remaining,
      summary: {
        totalAllocated,
        totalUsed,
        totalRemaining,
      },
    };
  }

  // 5. Cancel Leave Request (Teacher, only if pending)
  async cancelLeaveRequest(id: string, teacherId: string): Promise<any> {
    const leave = await this.leaveRequestModel.findById(id);
    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }
    if (leave.teacherId.toString() !== teacherId) {
      throw new BadRequestException('You are not authorized to cancel this leave request');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel a leave request with status ${leave.status}`);
    }

    leave.status = LeaveStatus.CANCELLED;
    await leave.save();

    await this.cacheService.del(`leave:my:${teacherId}`);
    await this.cacheService.delByPattern('leave:stats:*');
    await this.cacheService.delByPattern(`stats:teacher:${teacherId}`);

    this.scheduleGateway.broadcastLeaveUpdate('LEAVE_CANCELLED', { id, teacherId }, teacherId);

    return { success: true, message: 'Leave request cancelled successfully', leave };
  }

  // 6. Get all leaves (Admin)
  async getAllLeaves(status?: LeaveStatus, teacherId?: string): Promise<any> {
    const query: any = {};
    if (status) query.status = status;
    if (teacherId) query.teacherId = teacherId;

    return this.leaveRequestModel.find(query)
      .populate('teacher', 'id name email profilePicture timezone')
      .populate('reviewer', 'id name email')
      .sort({ createdAt: -1 })
      .lean();
  }

  // 7. Get Leave Stats (Admin dashboard)
  async getLeaveStats(): Promise<any> {
    const cacheKey = 'leave:stats:summary';
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, pending, approvedThisMonth, rejected] = await Promise.all([
      this.leaveRequestModel.countDocuments(),
      this.leaveRequestModel.countDocuments({ status: LeaveStatus.PENDING }),
      this.leaveRequestModel.countDocuments({
        status: LeaveStatus.APPROVED,
        reviewedAt: { $gte: startOfMonth },
      }),
      this.leaveRequestModel.countDocuments({ status: LeaveStatus.REJECTED }),
    ]);

    const result = {
      total,
      pending,
      approvedThisMonth,
      rejected,
    };

    await this.cacheService.set(cacheKey, result, 30);
    return result;
  }

  // 8. Approve Leave Request (Admin)
  async approveLeave(id: string, adminId: string, dto: ReviewLeaveRequestDto): Promise<any> {
    const leave = await this.leaveRequestModel.findById(id).populate('teacher', 'id name email');
    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(`Cannot approve leave request with status ${leave.status}`);
    }

    leave.status = LeaveStatus.APPROVED;
    leave.reviewedBy = adminId;
    leave.reviewedAt = new Date();
    if (dto.adminRemarks) leave.adminRemarks = dto.adminRemarks;
    await leave.save();

    // Auto-update teacher leave balance
    const teacherIdStr = leave.teacherId.toString();
    const year = new Date(leave.startDate).getFullYear();
    const balance = await this.getOrCreateBalance(teacherIdStr, year);
    const typeKey = leave.leaveType.toLowerCase() as keyof typeof balance.used;

    balance.used[typeKey] = (balance.used[typeKey] || 0) + leave.totalDays;
    await balance.save();

    // Auto-update teacher accountStatus to ON_LEAVE
    try {
      await this.userModel.findByIdAndUpdate(teacherIdStr, {
        $set: {
          accountStatus: AccountStatus.ON_LEAVE,
          accountStatusReason: `Approved ${leave.leaveType} leave from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}`,
          statusUpdatedAt: new Date(),
        },
      });
    } catch (_) {}

    // Send in-app notification to teacher
    await this.notificationsService.createNotification(
      teacherIdStr,
      'Leave Request Approved',
      `Your ${leave.leaveType} leave request for ${leave.totalDays} day(s) from ${new Date(leave.startDate).toLocaleDateString()} has been approved.${dto.adminRemarks ? ` Remarks: ${dto.adminRemarks}` : ''}`,
      NotificationType.LEAVE_APPROVED,
      { leaveId: leave._id.toString() },
    );

    const populated = await this.leaveRequestModel.findById(id)
      .populate('teacher', 'id name email profilePicture')
      .populate('reviewer', 'id name email')
      .lean();

    // Invalidate caches
    await this.cacheService.del(`leave:my:${teacherIdStr}`);
    await this.cacheService.delByPattern('leave:stats:*');
    await this.cacheService.delByPattern(`stats:teacher:${teacherIdStr}`);

    // Targeted WebSocket notification to teacher and broadcast
    this.scheduleGateway.sendToUser(teacherIdStr, 'leave_status_changed', {
      action: 'LEAVE_APPROVED',
      leave: populated,
    });
    this.scheduleGateway.broadcastLeaveUpdate('LEAVE_APPROVED', populated, teacherIdStr);

    return populated;
  }

  // 9. Reject Leave Request (Admin)
  async rejectLeave(id: string, adminId: string, dto: ReviewLeaveRequestDto): Promise<any> {
    const leave = await this.leaveRequestModel.findById(id).populate('teacher', 'id name email');
    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }
    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException(`Cannot reject leave request with status ${leave.status}`);
    }

    leave.status = LeaveStatus.REJECTED;
    leave.reviewedBy = adminId;
    leave.reviewedAt = new Date();
    if (dto.adminRemarks) leave.adminRemarks = dto.adminRemarks;
    await leave.save();

    const teacherIdStr = leave.teacherId.toString();

    // Send in-app notification to teacher
    await this.notificationsService.createNotification(
      teacherIdStr,
      'Leave Request Rejected',
      `Your ${leave.leaveType} leave request for ${leave.totalDays} day(s) from ${new Date(leave.startDate).toLocaleDateString()} was rejected.${dto.adminRemarks ? ` Remarks: ${dto.adminRemarks}` : ''}`,
      NotificationType.LEAVE_REJECTED,
      { leaveId: leave._id.toString() },
    );

    const populated = await this.leaveRequestModel.findById(id)
      .populate('teacher', 'id name email profilePicture')
      .populate('reviewer', 'id name email')
      .lean();

    // Invalidate caches
    await this.cacheService.del(`leave:my:${teacherIdStr}`);
    await this.cacheService.delByPattern('leave:stats:*');
    await this.cacheService.delByPattern(`stats:teacher:${teacherIdStr}`);

    // Targeted WebSocket notification to teacher and broadcast
    this.scheduleGateway.sendToUser(teacherIdStr, 'leave_status_changed', {
      action: 'LEAVE_REJECTED',
      leave: populated,
    });
    this.scheduleGateway.broadcastLeaveUpdate('LEAVE_REJECTED', populated, teacherIdStr);

    return populated;
  }

  // 10. Update Teacher Leave Balance (Admin)
  async updateTeacherBalance(teacherId: string, dto: UpdateLeaveBalanceDto, year: number = new Date().getFullYear()): Promise<any> {
    const balance = await this.getOrCreateBalance(teacherId, year);

    if (dto.sick !== undefined) balance.allocated.sick = dto.sick;
    if (dto.casual !== undefined) balance.allocated.casual = dto.casual;
    if (dto.annual !== undefined) balance.allocated.annual = dto.annual;
    if (dto.other !== undefined) balance.allocated.other = dto.other;

    await balance.save();
    await this.cacheService.delByPattern(`stats:teacher:${teacherId}`);

    return this.getTeacherBalance(teacherId, year);
  }
}
