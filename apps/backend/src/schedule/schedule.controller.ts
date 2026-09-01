import { Controller, Get, Post, Delete, Body, Query, UseGuards } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { UpsertSlotDto } from './dto/upsert-slot.dto';
import { DayOfWeek } from '../schemas/weekly-schedule-slot.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '../schemas';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('schedule')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Get('teachers')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getTeachers() {
    return this.scheduleService.getAvailableTeachers();
  }

  // Admin, supervisor, teacher, and student access to schedule grid
  @Get('grid')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.STUDENT)
  async getWeeklyGrid(@CurrentUser() user: any) {
    if (user.role === Role.TEACHER) {
      // If a teacher hits /grid, automatically enforce privacy and scope to teacher's own slots
      return this.scheduleService.getTeacherScheduleGrid(user.id);
    }
    if (user.role === Role.STUDENT) {
      // If a student hits /grid, automatically scope to student's enrolled courses and assigned slots
      return this.scheduleService.getStudentScheduleGrid(user.id);
    }
    return this.scheduleService.getWeeklyScheduleGrid();
  }

  // Scoped schedule grid for logged-in teacher
  @Get('grid/my')
  @Roles(Role.TEACHER)
  async getMyWeeklyGrid(@CurrentUser() user: any) {
    return this.scheduleService.getTeacherScheduleGrid(user.id);
  }

  // Scoped schedule grid for logged-in student
  @Get('grid/student')
  @Roles(Role.STUDENT)
  async getMyStudentWeeklyGrid(@CurrentUser() user: any) {
    return this.scheduleService.getStudentScheduleGrid(user.id);
  }

  @Post('slot')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async upsertSlot(@Body() dto: UpsertSlotDto) {
    return this.scheduleService.upsertSlot(dto);
  }

  @Delete('slot')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async removeSlot(
    @Query('dayOfWeek') dayOfWeek: DayOfWeek,
    @Query('timeSlotIndex') timeSlotIndex: number,
    @Query('clientId') clientId?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    return this.scheduleService.removeSlot(dayOfWeek, Number(timeSlotIndex), clientId, teacherId);
  }

  @Post('generate-weekly')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async generateWeekly(@Body('targetDate') targetDate?: string) {
    return this.scheduleService.generateWeeklySessions(targetDate);
  }
}
