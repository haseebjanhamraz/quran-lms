import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('transcripts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Post(':sessionId/generate')
  @Roles(Role.ADMIN)
  async triggerGeneration(@Param('sessionId') sessionId: string) {
    await this.transcriptService.queueTranscriptJob(sessionId);
    return { success: true, message: 'Transcript generation job queued.' };
  }

  @Get(':sessionId')
  @Roles(Role.ADMIN, Role.TEACHER, Role.REVIEWER)
  async getTranscript(@Param('sessionId') sessionId: string) {
    return this.transcriptService.getTranscript(sessionId);
  }
}
