import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClassReviewsService } from './class-reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('class-reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClassReviewsController {
  constructor(private readonly classReviewsService: ClassReviewsService) {}

  @Get('session/:sessionId')
  @Roles(Role.ADMIN, Role.REVIEWER, Role.TEACHER)
  async getReviewBySession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ) {
    return this.classReviewsService.getReviewBySession(sessionId, user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.REVIEWER)
  async saveReview(
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: any,
  ) {
    return this.classReviewsService.saveReview(dto, user);
  }

  @Post(':id/annotations')
  @Roles(Role.ADMIN, Role.REVIEWER)
  async addAnnotation(
    @Param('id') reviewId: string,
    @Body() dto: CreateAnnotationDto,
    @CurrentUser() user: any,
  ) {
    return this.classReviewsService.addAnnotation(reviewId, dto, user);
  }

  @Delete('annotations/:id')
  @Roles(Role.ADMIN, Role.REVIEWER)
  async deleteAnnotation(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.classReviewsService.deleteAnnotation(id, user);
  }

  @Get('pending')
  @Roles(Role.REVIEWER)
  async getPendingReviews(@CurrentUser() user: any) {
    return this.classReviewsService.getPendingReviews(user);
  }

  @Get('flagged')
  @Roles(Role.ADMIN)
  async getFlaggedReviews() {
    return this.classReviewsService.getFlaggedReviews();
  }
}
