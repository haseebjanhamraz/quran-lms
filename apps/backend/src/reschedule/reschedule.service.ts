import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RescheduleRequest,
  RescheduleRequestDocument,
  RescheduleStatus,
  ClassSession,
  ClassSessionDocument,
  ClassStatus,
  User,
  UserDocument,
  Role,
  NotificationType,
} from '../schemas';
import { CreateRescheduleRequestDto } from './dto/create-reschedule-request.dto';
import { ReviewRescheduleRequestDto } from './dto/review-reschedule-request.dto';
import { ClassSessionsService } from '../class-sessions/class-sessions.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RescheduleService {
  constructor(
    @InjectModel(RescheduleRequest.name)
    private readonly rescheduleModel: Model<RescheduleRequestDocument>,
    @InjectModel(ClassSession.name)
    private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly classSessionsService: ClassSessionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createRequest(studentId: string, dto: CreateRescheduleRequestDto) {
    const session = await this.classSessionModel.findById(dto.sessionId).populate('course');
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    if (session.status !== ClassStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot request reschedule for a class with status ${session.status}.`);
    }

    const now = new Date();
    const scheduledTime = new Date(session.scheduledAt).getTime();
    // Rule: Students can make advance class request even before 10 minutes the class schedule time starts
    const tenMinutesMs = 10 * 60 * 1000;
    if (scheduledTime - now.getTime() < tenMinutesMs) {
      throw new BadRequestException(
        'Reschedule request deadline passed. Requests must be submitted at least 10 minutes before the scheduled start time.',
      );
    }

    const requestedTime = new Date(dto.requestedTime);
    if (requestedTime.getTime() <= now.getTime()) {
      throw new BadRequestException('Requested time must be in the future.');
    }

    // Check for duplicate pending requests
    const existingPending = await this.rescheduleModel.findOne({
      sessionId: dto.sessionId,
      requestedBy: studentId,
      status: RescheduleStatus.PENDING,
    });

    if (existingPending) {
      throw new ConflictException('You already have a pending reschedule request for this class session.');
    }

    // Check for teacher schedule conflict at proposed new time
    const hasConflict = await this.classSessionsService.checkTeacherConflict(
      session.teacherId.toString(),
      requestedTime,
      session.durationMinutes,
      session._id.toString(),
    );

    if (hasConflict) {
      throw new ConflictException('The teacher has a scheduling conflict at the requested time slot.');
    }

    const request = await this.rescheduleModel.create({
      sessionId: dto.sessionId,
      requestedBy: studentId,
      originalScheduledAt: session.scheduledAt,
      requestedTime,
      reason: dto.reason,
      status: RescheduleStatus.PENDING,
    });

    // Notify admins
    const admins = await this.userModel.find({ role: Role.ADMIN });
    const studentDoc = await this.userModel.findById(studentId);
    const studentName = studentDoc?.name || 'Student';

    for (const admin of admins) {
      await this.notificationsService.createNotification(
        admin._id.toString(),
        'New Advance Class Request',
        `${studentName} requested to reschedule class to ${requestedTime.toLocaleString()}`,
        NotificationType.RESCHEDULE_REQUESTED,
        { requestId: request._id.toString(), sessionId: dto.sessionId },
      );
    }

    return this.rescheduleModel
      .findById(request._id)
      .populate('session')
      .populate('student', 'id name email profilePicture');
  }

  async getAllRequests(status?: RescheduleStatus) {
    const filter = status ? { status } : {};
    return this.rescheduleModel
      .find(filter)
      .populate({
        path: 'session',
        populate: [
          { path: 'course', select: 'id title type' },
          { path: 'teacher', select: 'id name email' },
        ],
      })
      .populate('student', 'id name email profilePicture')
      .populate('reviewer', 'id name')
      .sort({ createdAt: -1 });
  }

  async getStudentRequests(studentId: string) {
    return this.rescheduleModel
      .find({ requestedBy: studentId })
      .populate({
        path: 'session',
        populate: [
          { path: 'course', select: 'id title type' },
          { path: 'teacher', select: 'id name email' },
        ],
      })
      .populate('reviewer', 'id name')
      .sort({ createdAt: -1 });
  }

  async approveRequest(requestId: string, adminId: string, dto?: ReviewRescheduleRequestDto) {
    const request = await this.rescheduleModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Reschedule request not found');
    }

    if (request.status !== RescheduleStatus.PENDING) {
      throw new BadRequestException(`Request has already been ${request.status.toLowerCase()}.`);
    }

    const session = await this.classSessionModel.findById(request.sessionId);
    if (!session) {
      throw new NotFoundException('Associated class session not found');
    }

    // Double check conflict before final approval
    const hasConflict = await this.classSessionsService.checkTeacherConflict(
      session.teacherId.toString(),
      request.requestedTime,
      session.durationMinutes,
      session._id.toString(),
    );

    if (hasConflict) {
      throw new ConflictException('Teacher now has a conflict at the requested time slot.');
    }

    // Update class session time
    const newScheduledAt = new Date(request.requestedTime);
    const endedAt = new Date(newScheduledAt.getTime() + session.durationMinutes * 60 * 1000);

    await this.classSessionModel.findByIdAndUpdate(session._id, {
      $set: {
        scheduledAt: newScheduledAt,
        endedAt,
      },
    });

    // Update request document
    const updatedRequest = await this.rescheduleModel.findByIdAndUpdate(
      requestId,
      {
        $set: {
          status: RescheduleStatus.APPROVED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          ...(dto?.adminNote ? { adminNote: dto.adminNote } : {}),
        },
      },
      { new: true },
    );

    // Send notifications
    await this.notificationsService.createNotification(
      request.requestedBy.toString(),
      'Advance Class Request Approved',
      `Your request to reschedule class to ${newScheduledAt.toLocaleString()} has been approved.`,
      NotificationType.RESCHEDULE_APPROVED,
      { sessionId: session._id.toString() },
    );

    if (session.teacherId) {
      await this.notificationsService.createNotification(
        session.teacherId.toString(),
        'Class Rescheduled by Admin',
        `A class has been rescheduled to ${newScheduledAt.toLocaleString()} upon student request.`,
        NotificationType.RESCHEDULE_APPROVED,
        { sessionId: session._id.toString() },
      );
    }

    return updatedRequest;
  }

  async rejectRequest(requestId: string, adminId: string, dto?: ReviewRescheduleRequestDto) {
    const request = await this.rescheduleModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Reschedule request not found');
    }

    if (request.status !== RescheduleStatus.PENDING) {
      throw new BadRequestException(`Request has already been ${request.status.toLowerCase()}.`);
    }

    const updatedRequest = await this.rescheduleModel.findByIdAndUpdate(
      requestId,
      {
        $set: {
          status: RescheduleStatus.REJECTED,
          reviewedBy: adminId,
          reviewedAt: new Date(),
          ...(dto?.adminNote ? { adminNote: dto.adminNote } : {}),
        },
      },
      { new: true },
    );

    await this.notificationsService.createNotification(
      request.requestedBy.toString(),
      'Advance Class Request Declined',
      `Your request to reschedule class was declined.${dto?.adminNote ? ` Reason: ${dto.adminNote}` : ''}`,
      NotificationType.RESCHEDULE_REJECTED,
      { sessionId: request.sessionId.toString() },
    );

    return updatedRequest;
  }
}
