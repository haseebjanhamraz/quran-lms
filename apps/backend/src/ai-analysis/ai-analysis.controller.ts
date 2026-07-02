import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { AIAnalysisService } from './ai-analysis.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('ai-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AIAnalysisController {
  constructor(private readonly aiAnalysisService: AIAnalysisService) {}

  @Post(':sessionId/generate')
  @Roles(Role.ADMIN)
  async triggerAnalysis(@Param('sessionId') sessionId: string) {
    await this.aiAnalysisService.queueAnalysisJob(sessionId);
    return { success: true, message: 'AI Analysis job queued.' };
  }

  @Get(':sessionId')
  @Roles(Role.ADMIN, Role.REVIEWER)
  async getReport(@Param('sessionId') sessionId: string) {
    return this.aiAnalysisService.getReport(sessionId);
  }

  @Get()
  @Roles(Role.ADMIN)
  async listReports() {
    return this.aiAnalysisService.listReports();
  }
}
