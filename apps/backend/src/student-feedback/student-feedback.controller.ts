import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { StudentFeedbackService } from './student-feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('student-feedback')
export class StudentFeedbackController {
  constructor(private readonly studentFeedbackService: StudentFeedbackService) {}

  @Post()
  @Roles(Role.STUDENT)
  create(@CurrentUser() user: any, @Body() createFeedbackDto: CreateFeedbackDto) {
    return this.studentFeedbackService.create(user.id, createFeedbackDto);
  }

  @Get('my')
  @Roles(Role.STUDENT)
  findMyFeedback(@CurrentUser() user: any) {
    return this.studentFeedbackService.findMyFeedback(user.id);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.studentFeedbackService.findAll();
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  updateStatus(@Param('id') id: string, @Body() updateFeedbackDto: UpdateFeedbackDto) {
    return this.studentFeedbackService.updateStatus(id, updateFeedbackDto);
  }
}
