import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.enrollmentsService.findAll();
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.enrollmentsService.remove(id);
  }
}
