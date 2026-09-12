import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Broadcast,
  BroadcastDocument,
  BroadcastAudience,
  BroadcastPriority,
  User,
  UserDocument,
  Role,
  NotificationType,
} from '../schemas';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectModel(Broadcast.name) private readonly broadcastModel: Model<BroadcastDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly scheduleGateway: ScheduleGateway,
  ) {}

  async createBroadcast(dto: CreateBroadcastDto, currentUser: any) {
    const targetAudience = dto.targetAudience || BroadcastAudience.ALL;
    const priority = dto.priority || BroadcastPriority.NORMAL;
    const authorId = currentUser?.id || currentUser?._id;
    const authorName = currentUser?.name || 'Administrator';

    const broadcast = await this.broadcastModel.create({
      title: dto.title,
      message: dto.message,
      targetAudience,
      priority,
      sentBy: new Types.ObjectId(authorId),
      sentByName: authorName,
      readBy: [],
    });

    try {
      const userFilter: any = { isActive: true };
      const targetRolesForWs: string[] = [];

      if (targetAudience === BroadcastAudience.TEACHER) {
        userFilter.role = Role.TEACHER;
        targetRolesForWs.push('TEACHER');
      } else if (targetAudience === BroadcastAudience.STUDENT) {
        userFilter.role = Role.STUDENT;
        targetRolesForWs.push('STUDENT');
      } else {
        // ALL
        targetRolesForWs.push('TEACHER', 'STUDENT', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR', 'REVIEWER');
      }

      const targetUsers = await this.userModel.find(userFilter).select('_id');

      // Create in-app notifications
      for (const targetUser of targetUsers) {
        if (targetUser._id.toString() !== authorId.toString()) {
          await this.notificationsService.createNotification(
            targetUser._id.toString(),
            `Announcement: ${broadcast.title}`,
            broadcast.message,
            NotificationType.BROADCAST,
            { broadcastId: broadcast._id.toString(), priority, targetAudience },
          );
        }
      }

      // Realtime WebSocket broadcast
      this.scheduleGateway.sendToRoles(targetRolesForWs, 'new_broadcast', {
        broadcastId: broadcast._id.toString(),
        title: broadcast.title,
        message: broadcast.message,
        priority,
        targetAudience,
        sentByName: authorName,
        createdAt: broadcast.createdAt,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch broadcast notifications: ${err.message}`);
    }

    return broadcast;
  }

  async getBroadcasts(currentUser: any) {
    const role = currentUser?.role;
    const userId = (currentUser?.id || currentUser?._id)?.toString();

    const filter: any = {};

    if (role === Role.TEACHER) {
      filter.targetAudience = { $in: [BroadcastAudience.TEACHER, BroadcastAudience.ALL] };
    } else if (role === Role.STUDENT) {
      filter.targetAudience = { $in: [BroadcastAudience.STUDENT, BroadcastAudience.ALL] };
    }
    // Admin / Super Admin gets all

    const broadcasts = await this.broadcastModel
      .find(filter)
      .populate('sentBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    return broadcasts.map((b: any) => ({
      ...b,
      id: b._id.toString(),
      isRead: Array.isArray(b.readBy) && b.readBy.some((uid: any) => uid.toString() === userId),
    }));
  }

  async markAsRead(broadcastId: string, currentUser: any) {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) return;

    return this.broadcastModel.findByIdAndUpdate(
      broadcastId,
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
      { new: true },
    );
  }

  async deleteBroadcast(broadcastId: string) {
    const broadcast = await this.broadcastModel.findByIdAndDelete(broadcastId);
    if (!broadcast) throw new NotFoundException('Broadcast not found');
    return { success: true, message: 'Broadcast deleted successfully' };
  }
}
