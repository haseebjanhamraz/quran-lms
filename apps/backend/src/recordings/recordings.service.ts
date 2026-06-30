import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EgressClient, EncodedFileOutput } from 'livekit-server-sdk';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { RecordingStatus } from '@prisma/client';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);
  private egressClient: EgressClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @InjectQueue('recording-uploads') private readonly uploadQueue: Queue,
  ) {
    const host = this.configService.get<string>('LIVEKIT_HOST') || 'http://localhost:7880';
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || 'devkey';
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || 'secret';
    this.egressClient = new EgressClient(host, apiKey, apiSecret);
  }

  async startRoomRecording(sessionId: string) {
    const roomName = `room-${sessionId}`;
    this.logger.log(`Triggering LiveKit Room Composite Egress for room: ${roomName}`);

    try {
      const fileOutput = new EncodedFileOutput({
        filepath: `recordings/${roomName}.mp4`,
      });

      const egressInfo = await this.egressClient.startRoomCompositeEgress(roomName, fileOutput);

      const egressId = egressInfo.egressId;

      await this.prisma.recording.upsert({
        where: { sessionId },
        update: {
          status: RecordingStatus.PROCESSING,
        },
        create: {
          sessionId,
          status: RecordingStatus.PROCESSING,
          durationSeconds: 0,
        },
      });

      this.logger.log(`Egress composite recording successfully started. Egress ID: ${egressId}`);
      return { egressId };
    } catch (err: any) {
      this.logger.error(`Failed to start Room Composite Egress: ${err.message}`);
      this.logger.warn(`Dev Mode Fallback: Mocking local recording initialization.`);
      await this.prisma.recording.upsert({
        where: { sessionId },
        update: {
          status: RecordingStatus.PROCESSING,
        },
        create: {
          sessionId,
          status: RecordingStatus.PROCESSING,
          durationSeconds: 0,
        },
      });
      return { egressId: 'mock-egress-id' };
    }
  }

  async queueUploadJob(sessionId: string, filePath: string, filename: string) {
    this.logger.log(`Queueing Google Drive upload job for session: ${sessionId}`);
    await this.uploadQueue.add('upload', { sessionId, filePath, filename });
  }

  async getRecordingBySession(sessionId: string) {
    const rec = await this.prisma.recording.findUnique({
      where: { sessionId },
    });
    if (!rec) {
      throw new NotFoundException('No recording found for this class session');
    }
    return rec;
  }
}
