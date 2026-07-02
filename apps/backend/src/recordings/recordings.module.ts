import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RecordingsService } from './recordings.service';
import { RecordingsController } from './recordings.controller';
import { UploadProcessor } from './upload.processor';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { TranscriptModule } from '../transcript/transcript.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'recording-uploads',
    }),
    GoogleDriveModule,
    TranscriptModule,
  ],
  controllers: [RecordingsController],
  providers: [RecordingsService, UploadProcessor],
  exports: [RecordingsService],
})
export class RecordingsModule {}
