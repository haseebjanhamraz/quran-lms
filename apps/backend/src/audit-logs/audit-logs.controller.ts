import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Roles(Role.ADMIN)
  async findAll(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 100;
    const parsedPage = page ? parseInt(page, 10) : 1;
    return this.auditLogsService.findAll(parsedLimit, parsedPage);
  }
}
