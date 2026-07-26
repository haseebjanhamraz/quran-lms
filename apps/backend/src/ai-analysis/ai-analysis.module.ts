import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { AIAnalysisService } from './ai-analysis.service';
import { AIAnalysisController } from './ai-analysis.controller';
import { AIAnalysisProcessor } from './ai-analysis.processor';

import { SystemSettingsModule } from '../system-settings/system-settings.module';
import {
  AIReport, AIReportSchema,
  ClassSession, ClassSessionSchema,
  PipelineLog, PipelineLogSchema,
  User, UserSchema,
  Notification, NotificationSchema,
  TranscriptSegment, TranscriptSegmentSchema,
} from '../schemas';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
    SystemSettingsModule,
    MongooseModule.forFeature([
      { name: AIReport.name, schema: AIReportSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: PipelineLog.name, schema: PipelineLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: TranscriptSegment.name, schema: TranscriptSegmentSchema },
    ]),
  ],
  controllers: [AIAnalysisController],
  providers: [AIAnalysisService, AIAnalysisProcessor],
  exports: [AIAnalysisService, MongooseModule],
})
export class AIAnalysisModule {}
