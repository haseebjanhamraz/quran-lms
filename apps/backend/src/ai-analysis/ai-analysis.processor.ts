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
      const reportId = report?._id ? report._id.toString() : report?.id;
      this.logger.log(`AI Analysis completed successfully for session: ${sessionId}. Created report: ${reportId} with ${report?.violations?.length || 0} violations.`);
      return { success: true, reportId, violationsCount: report?.violations?.length || 0 };
    } catch (err: any) {
      this.logger.error(`Failed to process AI analysis: ${err.message}`);
      throw err;
    }
  }
}
