import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
@Processor('transcript-generation')
export class TranscriptProcessor extends WorkerHost {
  private readonly logger = new Logger(TranscriptProcessor.name);

  constructor(
    private readonly transcriptService: TranscriptService,
    private readonly prisma: PrismaService,
    @InjectQueue('ai-analysis') private readonly aiAnalysisQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<{ sessionId: string }>): Promise<any> {
    const { sessionId } = job.data;
    this.logger.log(`Processing transcript job for session: ${sessionId}`);

    try {
      const segments = await this.transcriptService.generateTranscript(sessionId);
      this.logger.log(`Transcript successfully generated with ${segments.length} segments.`);
      
      // Auto-chain AI Analysis
      this.logger.log(`Auto-queueing AI analysis job for session: ${sessionId}`);
      await this.aiAnalysisQueue.add('analyze', { sessionId });
      
      return { success: true, segmentsCount: segments.length };
    } catch (err: any) {
      this.logger.error(`Failed to process transcript generation: ${err.message}`);
      throw err;
    }
  }
}
