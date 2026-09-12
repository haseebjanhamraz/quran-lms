import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EgressClient, EncodedFileOutput, RoomServiceClient, EncodingOptionsPreset } from 'livekit-server-sdk';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Recording, RecordingDocument, RecordingStatus, ClassSession, ClassSessionDocument, ClassStatus } from '../schemas';

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);
  private egressClient: EgressClient;
  private readonly startingRecordings = new Set<string>();

  constructor(
    @InjectModel(Recording.name) private readonly recordingModel: Model<RecordingDocument>,
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    private readonly configService: ConfigService,
    @InjectQueue('recording-uploads') private readonly uploadQueue: Queue,
  ) {
    const host = this.configService.get<string>('LIVEKIT_HOST') || 'http://localhost:7880';
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || 'devkey';
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || 'secret';
    this.egressClient = new EgressClient(host, apiKey, apiSecret);
  }

  async startRoomRecording(sessionId: string) {
    if (this.startingRecordings.has(sessionId)) {
      this.logger.log(`Recording already initiating for session ${sessionId}. Skipping duplicate egress start.`);
      return { egressId: 'already-initiating' };
    }

    const session = await this.classSessionModel.findById(sessionId);
    if (session && session.status === ClassStatus.FROZEN) {
      this.logger.log(`Class session ${sessionId} is FROZEN (no student joined). Skipping room recording.`);
      return { egressId: 'cancelled-frozen' };
    }

    const existing = await this.recordingModel.findOne({ sessionId });
    if (existing && (existing.status === RecordingStatus.PROCESSING || existing.status === RecordingStatus.READY || existing.status === RecordingStatus.UPLOADING)) {
      this.logger.log(`Recording already ${existing.status} for session ${sessionId}. Skipping duplicate egress start.`);
      return { egressId: 'already-running' };
    }

    this.startingRecordings.add(sessionId);
    const roomName = `room-${sessionId}`;
    this.logger.log(`Pre-creating LiveKit room and starting Composite Egress for room: ${roomName}`);

    try {
      const host = this.configService.get<string>('LIVEKIT_HOST') || 'http://localhost:7880';
      const apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || 'devkey';
      const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || 'secret';
      const roomService = new RoomServiceClient(host, apiKey, apiSecret);
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 300,
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
        {
          layout: 'grid',
          encodingOptions: EncodingOptionsPreset.H264_720P_30,
        },
      );

      const egressId = egressInfo.egressId;

      await this.recordingModel.findOneAndUpdate(
        { sessionId },
        {
          $set: { status: RecordingStatus.PROCESSING },
          $setOnInsert: { sessionId, durationSeconds: 0 },
        },
        { upsert: true, new: true },
      );

      this.logger.log(`Egress composite recording successfully started. Egress ID: ${egressId}`);
      return { egressId };
    } catch (err: any) {
      this.logger.error(`Failed to start Room Composite Egress: ${err.message}`);
      this.logger.warn(`Dev Mode Fallback: Mocking local recording initialization.`);
      await this.recordingModel.findOneAndUpdate(
        { sessionId },
        {
          $set: { status: RecordingStatus.PROCESSING },
          $setOnInsert: { sessionId, durationSeconds: 0 },
        },
        { upsert: true, new: true },
      );
      return { egressId: 'mock-egress-id' };
    } finally {
      this.startingRecordings.delete(sessionId);
    }
  }

  async queueUploadJob(sessionId: string, filePath: string, filename: string, delay = 0) {
    this.logger.log(`Queueing local storage save job for session: ${sessionId}${delay ? ` (delayed ${delay}ms)` : ''}`);
    await this.uploadQueue.add(
      'upload',
      { sessionId, filePath, filename },
      {
        attempts: 10,
        delay,
        backoff: {
          type: 'fixed',
          delay: 5000,
        },
      },
    );
  }

  async getRecordingBySession(sessionId: string) {
    const rec = await this.recordingModel.findOne({ sessionId });
    if (!rec) {
      throw new NotFoundException('No recording found for this class session');
    }
    return rec;
  }

  async retryUpload(sessionId: string) {
    const rec = await this.recordingModel.findOne({ sessionId });
    if (!rec) {
      throw new NotFoundException('No recording record found for this session');
    }

    const filePath = rec.localPath || `recordings/room-${sessionId}.mp4`;
    const filename = filePath.split('/').pop() || `room-${sessionId}.mp4`;

    await this.recordingModel.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          status: RecordingStatus.PROCESSING,
          localPath: filePath,
        },
      },
    );

    await this.queueUploadJob(sessionId, filePath, filename);

    return { success: true, message: 'Upload retried', status: RecordingStatus.PROCESSING };
  }

  async getAllRecordings(query: any) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) {
        filter.createdAt.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const [recordings, total, stats] = await Promise.all([
      this.recordingModel
        .find(filter)
        .populate({
          path: 'session',
          populate: [
            { path: 'course', select: 'title type' },
            { path: 'teacher', select: 'id name email profilePicture' },
            { path: 'student', select: 'id name preferredName email studentId profilePicture' },
          ],
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.recordingModel.countDocuments(filter),
      this.recordingModel.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            ready: {
              $sum: { $cond: [{ $eq: ['$status', RecordingStatus.READY] }, 1, 0] },
            },
            processing: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', RecordingStatus.PROCESSING] },
                      { $eq: ['$status', RecordingStatus.UPLOADING] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', RecordingStatus.FAILED] }, 1, 0] },
            },
            totalSizeBytes: { $sum: { $ifNull: ['$fileSize', 0] } },
          },
        },
      ]),
    ]);

    const aggregateStats = stats[0] || {
      total: 0,
      ready: 0,
      processing: 0,
      failed: 0,
      totalSizeBytes: 0,
    };

    return {
      data: recordings.map((r: any) => ({
        ...r,
        id: r._id?.toString() || r.id,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: aggregateStats,
    };
  }

  async getStudentRecordings(studentId: string) {
    const studentFilter: any[] = [studentId];
    if (Types.ObjectId.isValid(studentId)) {
      studentFilter.push(new Types.ObjectId(studentId));
    }

    const sessions = await this.classSessionModel.find({
      studentId: { $in: studentFilter },
    })
      .populate('course', 'title type')
      .populate('teacher', 'name email')
      .populate('recording')
      .sort({ scheduledAt: -1 })
      .lean();

    return sessions
      .filter((s: any) => s.recording && s.recording.status === RecordingStatus.READY)
      .map((s: any) => ({
        sessionId: s._id.toString(),
        course: s.course,
        teacher: s.teacher,
        scheduledAt: s.scheduledAt,
        durationMinutes: s.durationMinutes,
        recording: {
          id: s.recording._id?.toString(),
          durationSeconds: s.recording.durationSeconds,
          status: s.recording.status,
          fileSize: s.recording.fileSize,
        },
      }));
  }
}
