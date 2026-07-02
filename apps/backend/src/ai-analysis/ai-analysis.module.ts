import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AIAnalysisService } from './ai-analysis.service';
import { AIAnalysisController } from './ai-analysis.controller';
import { AIAnalysisProcessor } from './ai-analysis.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-analysis',
    }),
  ],
  controllers: [AIAnalysisController],
  providers: [AIAnalysisService, AIAnalysisProcessor],
  exports: [AIAnalysisService],
})
export class AIAnalysisModule {}
