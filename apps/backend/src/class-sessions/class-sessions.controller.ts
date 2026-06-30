import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClassSessionsService } from './class-sessions.service';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { LogAttendanceDto } from './dto/log-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('class-sessions')
export class ClassSessionsController {
  constructor(private readonly classSessionsService: ClassSessionsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.TEACHER)
  async create(@Body() createClassSessionDto: CreateClassSessionDto) {
    return this.classSessionsService.create(createClassSessionDto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.TEACHER)
  async findAll() {
    return this.classSessionsService.findAll();
  }

  @Get('calendar')
  async getCalendar(@CurrentUser() user: any) {
    if (user.role === Role.ADMIN) {
      return this.classSessionsService.findAll();
    }
    if (user.role === Role.TEACHER) {
      return this.classSessionsService.findTeacherCalendar(user.id);
    }
    if (user.role === Role.STUDENT) {
      return this.classSessionsService.findStudentCalendar(user.id);
    }
    if (user.role === Role.REVIEWER) {
      return this.classSessionsService.findReviewerCalendar(user.id);
    }
    return [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.classSessionsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.TEACHER)
  async update(@Param('id') id: string, @Body() updateClassSessionDto: UpdateClassSessionDto) {
    return this.classSessionsService.update(id, updateClassSessionDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.classSessionsService.remove(id);
  }

  @Post(':id/attendance')
  @Roles(Role.ADMIN, Role.TEACHER)
  async logAttendance(
    @Param('id') id: string,
    @Body() dto: LogAttendanceDto,
  ) {
    return this.classSessionsService.logAttendance(
      id,
      dto.userId,
      dto.joinTime ? new Date(dto.joinTime) : undefined,
      dto.leaveTime ? new Date(dto.leaveTime) : undefined,
      dto.durationSeconds,
    );
  }

  @Get(':id/attendance')
  @Roles(Role.ADMIN, Role.TEACHER, Role.REVIEWER)
  async getAttendance(@Param('id') id: string) {
    return this.classSessionsService.getAttendance(id);
  }

  @Get(':id/token')
  async getToken(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.classSessionsService.generateLivekitToken(id, user);
  }
}
