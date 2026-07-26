import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification, NotificationDocument, NotificationType } from '../schemas';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    metadata?: any,
  ) {
    this.logger.log(`Creating notification of type ${type} for user: ${userId}`);
    return this.notificationModel.create({
      userId,
      title,
      message,
      type,
      metadata: metadata ?? {},
    });
  }

  async getUserNotifications(userId: string) {
    return this.notificationModel.find({ userId }).sort({ createdAt: -1 });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findById(id);

    if (!notification || notification.userId.toString() !== userId) {
      throw new NotFoundException('Notification not found');
    }

    return this.notificationModel.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true },
    );
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );
  }
}
