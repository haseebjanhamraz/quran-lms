import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import * as express from 'express';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':sessionId/pdf')
  @Roles(Role.ADMIN, Role.REVIEWER)
  async downloadPDF(
    @Param('sessionId') sessionId: string,
    @Res() res: express.Response,
  ) {
    const pdfBuffer = await this.reportsService.generateReportPDF(sessionId);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=AI_Report_${sessionId.slice(0, 8)}.pdf`,
      'Content-Length': pdfBuffer.length,
    });
    
    res.end(pdfBuffer);
  }
}
