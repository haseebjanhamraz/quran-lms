import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AIAnalysisService } from './ai-analysis.service';
import { AIAnalysisController } from './ai-analysis.controller';
import { AIAnalysisProcessor } from './ai-analysis.processor';

import { SystemSettingsModule } from '../system-settings/system-settings.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
    SystemSettingsModule,
  ],
  controllers: [AIAnalysisController],
  providers: [AIAnalysisService, AIAnalysisProcessor],
  exports: [AIAnalysisService],
})
export class AIAnalysisModule {}
