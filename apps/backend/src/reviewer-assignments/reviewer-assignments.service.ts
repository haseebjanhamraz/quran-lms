import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewerAssignmentDto } from './dto/create-reviewer-assignment.dto';

@Injectable()
export class ReviewerAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDto: CreateReviewerAssignmentDto) {
    const reviewer = await this.prisma.user.findUnique({
      where: { id: createDto.reviewerId },
    });
    if (!reviewer || reviewer.role !== 'REVIEWER') {
      throw new NotFoundException('The specified reviewer does not exist or does not hold the REVIEWER role.');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: createDto.courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.prisma.reviewerAssignment.findUnique({
      where: {
        reviewerId_courseId: {
          reviewerId: createDto.reviewerId,
          courseId: createDto.courseId,
        },
      },
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Reviewer is already assigned to this course.');
      } else {
        return this.prisma.reviewerAssignment.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
    }

    return this.prisma.reviewerAssignment.create({
      data: {
        reviewerId: createDto.reviewerId,
        courseId: createDto.courseId,
        isActive: true,
      },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.reviewerAssignment.findMany({
      where: { isActive: true },
      include: {
        reviewer: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
    });
  }

  async remove(id: string) {
    const assignment = await this.prisma.reviewerAssignment.findUnique({
      where: { id },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    // Set isActive to false instead of removing, keeping historical logs
    return this.prisma.reviewerAssignment.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async findByReviewer(reviewerId: string) {
    return this.prisma.reviewerAssignment.findMany({
      where: { reviewerId, isActive: true },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            type: true,
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
  }
}
