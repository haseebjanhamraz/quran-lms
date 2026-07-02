import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { AIAnalysisService } from '../ai-analysis/ai-analysis.service';

@Injectable()
@Processor('transcript-generation')
export class TranscriptProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptProcessor.name);

  constructor(
    private readonly transcriptService: TranscriptService,
    private readonly aiAnalysisService: AIAnalysisService,
  ) {
    super();
  }

  async process(job: Job<{ sessionId: string }>): Promise<any> {
    const { sessionId } = job.data;
    this.logger.log(`Processing transcript generation job for session: ${sessionId}`);

    try {
      const segments = await this.transcriptService.generateTranscript(sessionId);
      this.logger.log(`Transcript generation completed successfully for session: ${sessionId}. Created ${segments.length} segments.`);
      
      // Auto-trigger AI analysis on transcript completion
      try {
        await this.aiAnalysisService.queueAnalysisJob(sessionId);
      } catch (err: any) {
        this.logger.error(`Failed to auto-queue AI analysis job: ${err.message}`);
      }

      return { success: true, segmentsCount: segments.length };
    } catch (err: any) {
      this.logger.error(`Failed to process transcript generation: ${err.message}`);
      throw err;
    }
  }
}
