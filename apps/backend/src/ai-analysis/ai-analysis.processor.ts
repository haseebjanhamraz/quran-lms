import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { AIAnalysisService } from './ai-analysis.service';

@Injectable()
@Processor('ai-analysis')
export class AIAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(AIAnalysisProcessor.name);

  constructor(private readonly aiAnalysisService: AIAnalysisService) {
    super();
  }

  async process(job: Job<{ sessionId: string }>): Promise<any> {
    const { sessionId } = job.data;
    this.logger.log(`Processing AI analysis job for session: ${sessionId}`);

    try {
      const report = await this.aiAnalysisService.analyzeSession(sessionId);
      this.logger.log(`AI Analysis completed successfully for session: ${sessionId}. Created report: ${report.id} with ${report.violations.length} violations.`);
      return { success: true, reportId: report.id, violationsCount: report.violations.length };
    } catch (err: any) {
      this.logger.error(`Failed to process AI analysis: ${err.message}`);
      throw err;
    }
  }
}
