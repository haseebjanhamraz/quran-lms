import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { RecordingsService } from './recordings.service';
import { RecordingsController } from './recordings.controller';
import { UploadProcessor } from './upload.processor';
import { LocalStorageModule } from '../local-storage/local-storage.module';
import { TranscriptModule } from '../transcript/transcript.module';
import {
  Recording, RecordingSchema,
  PipelineLog, PipelineLogSchema,
  ClassSession, ClassSessionSchema,
  Notification, NotificationSchema,
} from '../schemas';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'recording-uploads',
    }),
    LocalStorageModule,
    TranscriptModule,
    MongooseModule.forFeature([
      { name: Recording.name, schema: RecordingSchema },
      { name: PipelineLog.name, schema: PipelineLogSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService, UploadProcessor],
  exports: [RecordingsService, MongooseModule],
})
export class RecordingsModule {}
