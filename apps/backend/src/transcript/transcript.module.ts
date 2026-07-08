import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';
import { TranscriptProcessor } from './transcript.processor';
import { LocalStorageModule } from '../local-storage/local-storage.module';
import { AIAnalysisModule } from '../ai-analysis/ai-analysis.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'transcript-generation' },
      { name: 'ai-analysis' },
    ),
    LocalStorageModule,
    AIAnalysisModule,
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService, TranscriptProcessor],
  exports: [TranscriptService],
})
export class TranscriptModule {}
