import { Controller, Post, Get, Param, UseGuards, Res, Headers, NotFoundException } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Response } from 'express';

@Controller('recordings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecordingsController {
  constructor(
    private readonly recordingsService: RecordingsService,
    private readonly localStorageService: LocalStorageService,
  ) {}

  @Post(':sessionId/start')
  @Roles(Role.ADMIN, Role.TEACHER)
  async startRecording(@Param('sessionId') sessionId: string) {
    return this.recordingsService.startRoomRecording(sessionId);
  }

  @Get(':sessionId')
  async getRecording(@Param('sessionId') sessionId: string) {
    return this.recordingsService.getRecordingBySession(sessionId);
  }

  @Get(':sessionId/stream')
  @Roles(Role.ADMIN, Role.TEACHER, Role.REVIEWER, Role.STUDENT)
  async streamRecording(
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
    @Headers('range') range?: string,
  ) {
    const recording = await this.recordingsService.getRecordingBySession(sessionId);
    if (!recording || !recording.filePath) {
      throw new NotFoundException('Recording not ready or not found');
    }
    return this.localStorageService.streamFile(recording.filePath, res, range);
  }

  @Post(':sessionId/retry')
  @Roles(Role.ADMIN, Role.TEACHER)
  async retryUpload(@Param('sessionId') sessionId: string) {
    return this.recordingsService.retryUpload(sessionId);
  }
}
