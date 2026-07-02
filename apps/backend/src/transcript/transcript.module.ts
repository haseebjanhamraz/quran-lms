import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';
import { TranscriptProcessor } from './transcript.processor';
import { GoogleDriveModule } from '../google-drive/google-drive.module';
import { AIAnalysisModule } from '../ai-analysis/ai-analysis.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'transcript-generation',
    }),
    GoogleDriveModule,
    AIAnalysisModule,
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService, TranscriptProcessor],
  exports: [TranscriptService],
})
export class TranscriptModule {}
