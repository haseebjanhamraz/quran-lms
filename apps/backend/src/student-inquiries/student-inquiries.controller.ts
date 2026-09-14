import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { StudentInquiriesService } from './student-inquiries.service';
import { CreateStudentInquiryDto } from './dto/create-student-inquiry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../schemas';

@Controller('student-inquiries')
export class StudentInquiriesController {
  constructor(private readonly inquiriesService: StudentInquiriesService) {}

  // Public endpoint for students/parents to submit inquiry
  @Post()
  async create(@Body() dto: CreateStudentInquiryDto) {
    const created = await this.inquiriesService.create(dto);
    return {
      success: true,
      message: 'Student information received successfully. Academic admissions will contact you soon.',
      inquiry: created,
    };
  }

  // Protected: Administrators, Supervisors, HR review inquiries
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.HR)
  @Get()
  async findAll(@Query('status') status?: string) {
    return this.inquiriesService.findAll(status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.HR)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.inquiriesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERVISOR, Role.HR)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ) {
    return this.inquiriesService.updateStatus(id, status, notes);
  }
}
