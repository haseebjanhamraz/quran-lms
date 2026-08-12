import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecordingsService } from '../recordings/recordings.service';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient } from 'livekit-server-sdk';
import {
  ClassSession, ClassSessionDocument, ClassStatus,
  Recording, RecordingDocument, RecordingStatus,
  User, UserDocument, Role,
  Attendance, AttendanceDocument,
} from '../schemas';

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);

  constructor(
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(Recording.name) private readonly recordingModel: Model<RecordingDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    private readonly recordingsService: RecordingsService,
    private readonly configService: ConfigService,
  ) {}

  async handleWebhookEvent(event: any) {
    this.logger.log(`Received LiveKit webhook event: ${event.event}`);

    const roomName = event.room?.name || event.egressInfo?.roomName || event.egress_info?.room_name || event.egress_info?.roomName;
    if (!roomName || !roomName.startsWith('room-')) return;

    const sessionId = roomName.substring(5);

    switch (event.event) {
      case 'room_finished':
        await this.handleRoomFinished(sessionId);
        break;
      case 'participant_joined':
        await this.handleParticipantJoined(sessionId, event.participant);
        break;
      case 'participant_left':
        await this.handleParticipantLeft(sessionId, event.participant);
        break;
      case 'track_published':
        await this.handleTrackPublished(sessionId, event);
        break;
      case 'egress_ended':
        await this.handleEgressEnded(sessionId, event);
        break;
    }
  }

  private async handleRoomFinished(sessionId: string) {
    this.logger.log(`Class session room finished: ${sessionId}`);
    try {
      const session = await this.classSessionModel.findById(sessionId);
      if (session && session.status === ClassStatus.LIVE) {
        await this.classSessionModel.findByIdAndUpdate(sessionId, {
          $set: { status: ClassStatus.COMPLETED },
        });
      }

      const recording = await this.recordingModel.findOne({ sessionId });
      if (recording && recording.status === RecordingStatus.PROCESSING) {
        const filePath = `recordings/room-${sessionId}.mp4`;
        const filename = `recording-${sessionId}.mp4`;
        this.logger.log(`Room finished — queuing delayed upload fallback (90s) for session: ${sessionId}`);
        await this.recordingsService.queueUploadJob(sessionId, filePath, filename, 90000);
      }
    } catch (err: any) {
      this.logger.error(`Error completing session: ${err.message}`);
    }
  }

  private async handleEgressEnded(sessionId: string, event: any) {
    this.logger.log(`Egress ended webhook received for session: ${sessionId}`);
    const egressInfo = event.egressInfo || event.egress_info;
    const fileResults = egressInfo?.fileResults || egressInfo?.file_results;
    const status = egressInfo?.status;
    const isFailed = status === 'EGRESS_FAILED' || status === 4 || status === 'EGRESS_ABORTED' || status === 5;
    const isEgressSuccess = !isFailed && (
      status === 'EGRESS_COMPLETE' || status === 3 || status === 'COMPLETE' || status === 0 || status === 'EGRESS_STARTING' ||
      (fileResults && fileResults.length > 0) || egressInfo?.file?.result?.filepath
    );

    if (!isEgressSuccess) {
      this.logger.warn(`Egress ended without successful status (status=${status}) for session ${sessionId}. Marking recording as FAILED.`);
      await this.recordingModel.findOneAndUpdate(
        { sessionId },
        { $set: { status: RecordingStatus.FAILED } },
      ).catch(() => {});
      return;
    }

    let filePath = `recordings/room-${sessionId}.mp4`;
    if (fileResults && fileResults.length > 0) {
      filePath = fileResults[0].filename || fileResults[0].location || filePath;
    } else if (egressInfo?.file?.result?.filepath) {
      filePath = egressInfo.file.result.filepath;
    }
    const filename = `recording-${sessionId}.mp4`;
    await this.recordingsService.queueUploadJob(sessionId, filePath, filename);
  }

  private async handleParticipantJoined(sessionId: string, participant: any) {
    const userId = participant.identity;
    this.logger.log(`Participant joined: user=${userId}, room=${sessionId}`);

    try {
      const user = await this.userModel.findById(userId);

      if (user && user.role === Role.STUDENT) {
        await this.attendanceModel.findOneAndUpdate(
          { sessionId, userId },
          {
            $set: { joinTime: new Date() },
            $setOnInsert: { sessionId, userId, durationSeconds: 0 },
          },
          { upsert: true, new: true },
        );
      }
    } catch (err: any) {
      this.logger.error(`Error updating join attendance: ${err.message}`);
    }
  }

  private async handleTrackPublished(sessionId: string, event: any) {
    const participant = event.participant;
    const userId = participant?.identity;
    if (!userId) return;

    this.logger.log(`Track published by user=${userId} in session=${sessionId}`);

    try {
      const user = await this.userModel.findById(userId);

      if (user && user.role === Role.TEACHER) {
        const recording = await this.recordingModel.findOne({ sessionId });
        if (!recording || recording.status === RecordingStatus.FAILED) {
          this.logger.log(`Teacher published track — starting egress recording for session: ${sessionId}`);
          await this.recordingsService.startRoomRecording(sessionId);
        } else {
          this.logger.log(`Recording already ${recording.status} for session ${sessionId}. Skipping egress start.`);
        }
        this.scheduleIdleCheck(sessionId);
      }
    } catch (err: any) {
      this.logger.error(`Error handling track published: ${err.message}`);
    }
  }

  private scheduleIdleCheck(sessionId: string) {
    const graceMs = 10 * 60 * 1000; // 10 minutes grace period
    this.logger.log(`Scheduling idle student check for session ${sessionId} in 10 minutes.`);
    setTimeout(async () => {
      await this.checkAndFreezeIdleSession(sessionId);
    }, graceMs);
  }

  async checkAndFreezeIdleSession(sessionId: string) {
    try {
      const session = await this.classSessionModel.findById(sessionId);
      if (!session || session.status !== ClassStatus.LIVE) return;

      const attendances = await this.attendanceModel.find({ sessionId });
      const hasStudentAttendance = attendances.length > 0;

      if (!hasStudentAttendance) {
        this.logger.log(`No student joined session ${sessionId} within 10 minutes. Freezing session and stopping recordings.`);
        await this.classSessionModel.findByIdAndUpdate(sessionId, {
          $set: { status: ClassStatus.FROZEN, endedAt: new Date() },
        });

        await this.recordingModel.findOneAndUpdate(
          { sessionId },
          { $set: { status: RecordingStatus.CANCELLED } },
        );

        try {
          const livekitHost = this.configService.getOrThrow<string>('LIVEKIT_HOST');
          const apiKey = this.configService.getOrThrow<string>('LIVEKIT_API_KEY');
          const apiSecret = this.configService.getOrThrow<string>('LIVEKIT_API_SECRET');
          const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
          await roomService.deleteRoom(`room-${sessionId}`);
        } catch (err: any) {
          this.logger.error(`Failed to delete room for frozen session ${sessionId}: ${err.message}`);
        }
      }
    } catch (err: any) {
      this.logger.error(`Error checking idle session ${sessionId}: ${err.message}`);
    }
  }

  private async handleParticipantLeft(sessionId: string, participant: any) {
    const userId = participant.identity;
    this.logger.log(`Participant left: user=${userId}, room=${sessionId}`);

    try {
      const attendance = await this.attendanceModel.findOne({ sessionId, userId });

      if (attendance && attendance.joinTime) {
        const leaveTime = new Date();
        const sessionDuration = Math.round((leaveTime.getTime() - attendance.joinTime.getTime()) / 1000);

        await this.attendanceModel.findOneAndUpdate(
          { sessionId, userId },
          {
            $set: { leaveTime },
            $inc: { durationSeconds: sessionDuration > 0 ? sessionDuration : 0 },
          },
        );
      }
    } catch (err: any) {
      this.logger.error(`Error updating leave attendance: ${err.message}`);
    }
  }

  async muteParticipant(roomName: string, identity: string, trackSid: string, muted: boolean) {
    try {
      const livekitHost = this.configService.getOrThrow<string>('LIVEKIT_HOST');
      const apiKey = this.configService.getOrThrow<string>('LIVEKIT_API_KEY');
      const apiSecret = this.configService.getOrThrow<string>('LIVEKIT_API_SECRET');
      const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
      await roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
      this.logger.log(`Successfully remote-muted track ${trackSid} of participant ${identity} in room ${roomName}`);
    } catch (err: any) {
      this.logger.error(`Failed to remote-mute participant ${identity} in room ${roomName}: ${err.message}`);
      throw err;
    }
  }
}
