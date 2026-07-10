import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EgressClient, EncodedFileOutput, RoomServiceClient, EncodingOptionsPreset } from 'livekit-server-sdk';
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
    this.logger.log(`Pre-creating LiveKit room and starting Composite Egress for room: ${roomName}`);

    // Pre-create the room explicitly so Egress does not fail with "requested room does not exist"
    try {
      const host = this.configService.get<string>('LIVEKIT_HOST') || 'http://localhost:7880';
      const apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || 'devkey';
      const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || 'secret';
      const roomService = new RoomServiceClient(host, apiKey, apiSecret);
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300, // keep alive for 5 minutes if empty
      });
      this.logger.log(`LiveKit room ${roomName} pre-created successfully.`);
    } catch (err: any) {
      this.logger.error(`Failed to pre-create LiveKit room: ${err.message}`);
    }

    try {
      const fileOutput = new EncodedFileOutput({
        filepath: `/recordings/${roomName}.mp4`,
      });

      const egressInfo = await this.egressClient.startRoomCompositeEgress(
        roomName,
        fileOutput,
        undefined,
        EncodingOptionsPreset.H264_720P_30,
      );

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
    this.logger.log(`Queueing local storage save job for session: ${sessionId}`);
    await this.uploadQueue.add(
      'upload',
      { sessionId, filePath, filename },
      {
        attempts: 10,
        backoff: {
          type: 'fixed',
          delay: 5000, // Retry every 5 seconds
        },
      }
    );
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

  async retryUpload(sessionId: string) {
    const rec = await this.prisma.recording.findUnique({
      where: { sessionId },
    });
    if (!rec) {
      throw new NotFoundException('No recording record found for this session');
    }

    const filePath = rec.localPath || `recordings/room-${sessionId}.mp4`;
    const filename = filePath.split('/').pop() || `room-${sessionId}.mp4`;

    await this.prisma.recording.update({
      where: { sessionId },
      data: {
        status: RecordingStatus.PROCESSING,
        localPath: filePath,
      },
    });

    await this.queueUploadJob(sessionId, filePath, filename);

    return { success: true, message: 'Upload retried', status: RecordingStatus.PROCESSING };
  }
}
