import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpsertSlotDto } from './dto/upsert-slot.dto';
import { DayOfWeek } from '../schemas/weekly-schedule-slot.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('teachers')
  @Roles(Role.ADMIN)
  async getTeachers() {
    return this.scheduleService.getAvailableTeachers();
  }

  @Get('grid')
  @Roles(Role.ADMIN, Role.TEACHER, Role.SUPERVISOR)
  async getWeeklyGrid() {
    return this.scheduleService.getWeeklyScheduleGrid();
  }

  @Post('slot')
  @Roles(Role.ADMIN)
  async upsertSlot(@Body() dto: UpsertSlotDto) {
    return this.scheduleService.upsertSlot(dto);
  }

  @Delete('slot')
  @Roles(Role.ADMIN)
  async removeSlot(
    @Query('dayOfWeek') dayOfWeek: DayOfWeek,
    @Query('timeSlotIndex') timeSlotIndex: number,
    @Query('clientId') clientId?: string,
  ) {
    return this.scheduleService.removeSlot(dayOfWeek, Number(timeSlotIndex), clientId);
  }

  @Post('generate-weekly')
  @Roles(Role.ADMIN)
  async generateWeekly(@Body('targetDate') targetDate?: string) {
    return this.scheduleService.generateWeeklySessions(targetDate);
  }
}
