import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient } from 'livekit-server-sdk';
import {
  ClassSession,
  ClassSessionDocument,
  ClassStatus,
  NotificationType,
} from '../schemas';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class ClassExpiryService {
  private readonly logger = new Logger(ClassExpiryService.name);

  constructor(
    @InjectModel(ClassSession.name)
    private readonly classSessionModel: Model<ClassSessionDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
    private readonly cacheService: RedisCacheService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleClassExpiryAndCleanup() {
    this.logger.log('Running automated class schedule expiry & stale live cleanup check...');
    await this.expirePastScheduledSessions();
    await this.cleanupStaleLiveSessions();
  }

  async expirePastScheduledSessions(): Promise<number> {
    const now = new Date();
    // Default grace period before marking expired (e.g. 15 minutes after scheduled finish time)
    const gracePeriodMinutes = 15;

    // Find SCHEDULED sessions whose end time + grace period is in the past
    const scheduledSessions = await this.classSessionModel.find({
      status: ClassStatus.SCHEDULED,
    });

    let expiredCount = 0;

    for (const session of scheduledSessions) {
      const scheduledTime = new Date(session.scheduledAt).getTime();
      const durationMs = session.durationMinutes * 60 * 1000;
      const gracePeriodMs = gracePeriodMinutes * 60 * 1000;
      const expireCutoff = scheduledTime + durationMs + gracePeriodMs;

      if (now.getTime() > expireCutoff) {
        const endedAt = new Date(scheduledTime + durationMs);

        await this.classSessionModel.findByIdAndUpdate(session._id, {
          $set: {
            status: ClassStatus.EXPIRED,
            endedAt,
          },
        });

        expiredCount++;
        this.logger.log(`Class session ${session._id} marked as EXPIRED.`);

        // Send notifications
        const courseTitle = (session as any).course?.title || 'Class';
        if (session.teacherId) {
          await this.notificationsService.createNotification(
            session.teacherId.toString(),
            'Class Expired',
            `Your scheduled session for ${courseTitle} at ${new Date(session.scheduledAt).toLocaleString()} has expired.`,
            NotificationType.CLASS_EXPIRED,
            { sessionId: session._id.toString() },
          );
        }

        if (session.studentId) {
          await this.notificationsService.createNotification(
            session.studentId.toString(),
            'Class Expired',
            `The scheduled session for ${courseTitle} at ${new Date(session.scheduledAt).toLocaleString()} has expired.`,
            NotificationType.CLASS_EXPIRED,
            { sessionId: session._id.toString() },
          );
        }
      }
    }

    if (expiredCount > 0) {
      await this.cacheService.delByPattern('sessions:*');
      await this.cacheService.delByPattern('stats:*');
      this.logger.log(`Successfully expired ${expiredCount} past scheduled class sessions.`);
    }

    return expiredCount;
  }

  async cleanupStaleLiveSessions(): Promise<number> {
    const now = new Date();
    const liveSessions = await this.classSessionModel.find({
      status: ClassStatus.LIVE,
    });

    let cleanedCount = 0;

    for (const session of liveSessions) {
      const startTime = session.actualStartTime || session.startedAt || session.scheduledAt;
      const startMs = new Date(startTime).getTime();
      const durationMs = session.durationMinutes * 60 * 1000;
      // Overtime cutoff: class duration + 30 mins overtime limit
      const cutoffMs = startMs + durationMs + 30 * 60 * 1000;

      if (now.getTime() > cutoffMs) {
        await this.classSessionModel.findByIdAndUpdate(session._id, {
          $set: {
            status: ClassStatus.COMPLETED,
            actualEndTime: now,
          },
        });

        cleanedCount++;
        this.logger.log(`Stale LIVE class session ${session._id} auto-completed.`);

        try {
          const livekitHost = this.configService.getOrThrow<string>('LIVEKIT_HOST');
          const apiKey = this.configService.getOrThrow<string>('LIVEKIT_API_KEY');
          const apiSecret = this.configService.getOrThrow<string>('LIVEKIT_API_SECRET');
          const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
          await roomService.deleteRoom(`room-${session._id.toString()}`);
        } catch (err: any) {
          this.logger.warn(`Could not delete LiveKit room for stale session ${session._id}: ${err.message}`);
        }
      }
    }

    if (cleanedCount > 0) {
      await this.cacheService.delByPattern('sessions:*');
      await this.cacheService.delByPattern('stats:*');
    }

    return cleanedCount;
  }
}
