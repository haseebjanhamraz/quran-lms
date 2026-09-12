import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Notice,
  NoticeDocument,
  NoticeTargetRole,
  User,
  UserDocument,
  Role,
  NotificationType,
} from '../schemas';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';

@Injectable()
export class NoticeBoardService {
  private readonly logger = new Logger(NoticeBoardService.name);

  constructor(
    @InjectModel(Notice.name) private readonly noticeModel: Model<NoticeDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly scheduleGateway: ScheduleGateway,
  ) {}

  async createNotice(dto: CreateNoticeDto, currentUser: any) {
    const targetRole = dto.targetRole || NoticeTargetRole.TEACHER;
    const authorId = currentUser?.id || currentUser?._id;
    const authorName = currentUser?.name || 'Administrator';

    const notice = await this.noticeModel.create({
      title: dto.title,
      content: dto.content,
      targetRole,
      attachments: dto.attachments || [],
      isPinned: dto.isPinned ?? false,
      isActive: true,
      postedBy: new Types.ObjectId(authorId),
      postedByName: authorName,
      readBy: [],
    });

    // Notify the relevant personnel
    try {
      const userFilter: any = { isActive: true };
      const targetRolesForWs: string[] = [];

      if (targetRole === NoticeTargetRole.TEACHER) {
        userFilter.role = Role.TEACHER;
        targetRolesForWs.push('TEACHER');
      } else if (targetRole === NoticeTargetRole.STUDENT) {
        userFilter.role = Role.STUDENT;
        targetRolesForWs.push('STUDENT');
      } else {
        // ALL
        targetRolesForWs.push('TEACHER', 'STUDENT', 'ADMIN', 'SUPER_ADMIN', 'SUPERVISOR');
      }

      const targetUsers = await this.userModel.find(userFilter).select('_id');

      // Create in-app notifications
      for (const targetUser of targetUsers) {
        if (targetUser._id.toString() !== authorId.toString()) {
          await this.notificationsService.createNotification(
            targetUser._id.toString(),
            `New Notice: ${notice.title}`,
            `A new notice has been posted for ${targetRole.toLowerCase()}s: ${notice.title}. Open the Notice Board to view details and attachments.`,
            NotificationType.NOTICE_POSTED,
            { noticeId: notice._id.toString(), targetRole },
          );
        }
      }

      // Realtime WebSocket broadcast
      this.scheduleGateway.sendToRoles(targetRolesForWs, 'new_notice', {
        noticeId: notice._id.toString(),
        title: notice.title,
        targetRole,
        postedByName: authorName,
        createdAt: notice.createdAt,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to dispatch notice notifications: ${err.message}`);
    }

    return notice;
  }

  async getNotices(currentUser: any) {
    const role = currentUser?.role;
    const userId = (currentUser?.id || currentUser?._id)?.toString();

    const filter: any = { isActive: true };

    if (role === Role.TEACHER) {
      filter.targetRole = { $in: [NoticeTargetRole.TEACHER, NoticeTargetRole.ALL] };
    } else if (role === Role.STUDENT) {
      filter.targetRole = { $in: [NoticeTargetRole.STUDENT, NoticeTargetRole.ALL] };
    }
    // Admin / Super Admin gets all notices

    const notices = await this.noticeModel
      .find(filter)
      .populate('postedBy', 'name email role')
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    return notices.map((n: any) => ({
      ...n,
      id: n._id.toString(),
      isRead: Array.isArray(n.readBy) && n.readBy.some((uid: any) => uid.toString() === userId),
    }));
  }

  async markAsRead(noticeId: string, currentUser: any) {
    const userId = currentUser?.id || currentUser?._id;
    if (!userId) return;

    return this.noticeModel.findByIdAndUpdate(
      noticeId,
      { $addToSet: { readBy: new Types.ObjectId(userId) } },
      { new: true },
    );
  }

  async togglePin(noticeId: string) {
    const notice = await this.noticeModel.findById(noticeId);
    if (!notice) throw new NotFoundException('Notice not found');

    notice.isPinned = !notice.isPinned;
    return notice.save();
  }

  async deleteNotice(noticeId: string) {
    const notice = await this.noticeModel.findByIdAndDelete(noticeId);
    if (!notice) throw new NotFoundException('Notice not found');
    return { success: true, message: 'Notice deleted successfully' };
  }
}
