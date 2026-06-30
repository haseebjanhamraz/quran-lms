import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ReviewerAssignmentsService } from './reviewer-assignments.service';
import { CreateReviewerAssignmentDto } from './dto/create-reviewer-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reviewer-assignments')
export class ReviewerAssignmentsController {
  constructor(private readonly reviewerAssignmentsService: ReviewerAssignmentsService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createDto: CreateReviewerAssignmentDto) {
    return this.reviewerAssignmentsService.create(createDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    return this.reviewerAssignmentsService.findAll();
  }

  @Get('reviewer/:reviewerId')
  @Roles(Role.ADMIN, Role.REVIEWER)
  async findByReviewer(@Param('reviewerId') reviewerId: string) {
    return this.reviewerAssignmentsService.findByReviewer(reviewerId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.reviewerAssignmentsService.remove(id);
  }
}
