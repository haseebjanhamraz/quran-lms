import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('recordings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Post(':sessionId/start')
  @Roles(Role.ADMIN, Role.TEACHER)
  async startRecording(@Param('sessionId') sessionId: string) {
    return this.recordingsService.startRoomRecording(sessionId);
  }

  @Get(':sessionId')
  async getRecording(@Param('sessionId') sessionId: string) {
    return this.recordingsService.getRecordingBySession(sessionId);
  }

  @Post(':sessionId/retry')
  @Roles(Role.ADMIN, Role.TEACHER)
  async retryUpload(@Param('sessionId') sessionId: string) {
    return this.recordingsService.retryUpload(sessionId);
  }
}
