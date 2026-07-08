import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClassStatus, Role, RecordingStatus } from '@prisma/client';
import { RecordingsService } from '../recordings/recordings.service';
import { ConfigService } from '@nestjs/config';
import { RoomServiceClient } from 'livekit-server-sdk';

@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recordingsService: RecordingsService,
    private readonly configService: ConfigService,
  ) {}

  async handleWebhookEvent(event: any) {
    this.logger.log(`Received LiveKit webhook event: ${event.event}`);

    const roomName = event.room?.name || event.egressInfo?.roomName;
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
      case 'egress_ended':
        await this.handleEgressEnded(sessionId, event);
        break;
    }
  }

  private async handleRoomFinished(sessionId: string) {
    this.logger.log(`Class session room finished: ${sessionId}`);
    try {
      const session = await this.prisma.classSession.findUnique({
        where: { id: sessionId },
      });
      if (session && session.status === ClassStatus.LIVE) {
        await this.prisma.classSession.update({
          where: { id: sessionId },
          data: { status: ClassStatus.COMPLETED },
        });
      }

      const recording = await this.prisma.recording.findUnique({
        where: { sessionId },
      });
      if (recording && recording.status === RecordingStatus.PROCESSING) {
        const filePath = `recordings/room-${sessionId}.mp4`;
        const filename = `recording-${sessionId}.mp4`;
        this.logger.log(`Mocking Egress ending for dev testing: Queueing upload job.`);
        await this.recordingsService.queueUploadJob(sessionId, filePath, filename);
      }
    } catch (err: any) {
      this.logger.error(`Error completing session: ${err.message}`);
    }
  }

  private async handleEgressEnded(sessionId: string, event: any) {
    this.logger.log(`Egress ended webhook received for session: ${sessionId}`);
    const egressInfo = event.egressInfo;
    let filePath = `recordings/room-${sessionId}.mp4`;
    if (egressInfo?.fileResults && egressInfo.fileResults.length > 0) {
      filePath = egressInfo.fileResults[0].filename;
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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (user && user.role === Role.STUDENT) {
        await this.prisma.attendance.upsert({
          where: {
            sessionId_userId: {
              sessionId,
              userId,
            },
          },
          update: {
            joinTime: new Date(),
          },
          create: {
            sessionId,
            userId,
            joinTime: new Date(),
            durationSeconds: 0,
          },
        });
      }
    } catch (err: any) {
      this.logger.error(`Error updating join attendance: ${err.message}`);
    }
  }

  private async handleParticipantLeft(sessionId: string, participant: any) {
    const userId = participant.identity;
    this.logger.log(`Participant left: user=${userId}, room=${sessionId}`);

    try {
      const attendance = await this.prisma.attendance.findUnique({
        where: {
          sessionId_userId: {
            sessionId,
            userId,
          },
        },
      });

      if (attendance && attendance.joinTime) {
        const leaveTime = new Date();
        const sessionDuration = Math.round((leaveTime.getTime() - attendance.joinTime.getTime()) / 1000);
        
        await this.prisma.attendance.update({
          where: {
            sessionId_userId: {
              sessionId,
              userId,
            },
          },
          data: {
            leaveTime,
            durationSeconds: {
              increment: sessionDuration > 0 ? sessionDuration : 0,
            },
          },
        });
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
