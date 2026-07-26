import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';
import { TranscriptProcessor } from './transcript.processor';
import { LocalStorageModule } from '../local-storage/local-storage.module';
import { AIAnalysisModule } from '../ai-analysis/ai-analysis.module';
import {
  TranscriptSegment, TranscriptSegmentSchema,
  ClassSession, ClassSessionSchema,
  Recording, RecordingSchema,
  PipelineLog, PipelineLogSchema,
} from '../schemas';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'transcript-generation' },
      { name: 'ai-analysis' },
    ),
    LocalStorageModule,
    AIAnalysisModule,
    MongooseModule.forFeature([
      { name: TranscriptSegment.name, schema: TranscriptSegmentSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: Recording.name, schema: RecordingSchema },
      { name: PipelineLog.name, schema: PipelineLogSchema },
    ]),
  ],
  controllers: [TranscriptController],
  providers: [TranscriptService, TranscriptProcessor],
  exports: [TranscriptService, MongooseModule],
})
export class TranscriptModule {}
