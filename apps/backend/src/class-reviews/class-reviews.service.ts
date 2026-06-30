import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateAnnotationDto } from './dto/create-annotation.dto';
import { ReviewStatus, ReviewMode, Role } from '@prisma/client';

@Injectable()
export class ClassReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async getReviewBySession(sessionId: string, user: any) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    if (user.role === Role.REVIEWER) {
      const assigned = await this.prisma.reviewerAssignment.findFirst({
        where: {
          reviewerId: user.id,
          courseId: session.courseId,
          isActive: true,
        },
      });
      if (!assigned) {
        throw new ForbiddenException('You are not assigned to review this course');
      }
    } else if (user.role === Role.TEACHER) {
      if (session.teacherId !== user.id) {
        throw new ForbiddenException('You are not authorized to view reviews for this session');
      }
    }

    let review = await this.prisma.classReview.findFirst({
      where: { sessionId },
      include: {
        annotations: { orderBy: { timestamp: 'asc' } },
        session: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                type: true,
                teacher: { select: { id: true, name: true, email: true } },
              },
            },
            recording: true,
          },
        },
      },
    });

    if (!review) {
      review = await this.prisma.classReview.create({
        data: {
          sessionId,
          reviewerId: user.role === Role.REVIEWER ? user.id : (await this.findDefaultReviewerId(sessionId)),
          reviewMode: ReviewMode.RECORDING_REVIEW,
          curriculumAdherenceScore: 5,
          teachingQualityScore: 5,
          engagementScore: 5,
          overallScore: 5.0,
          strengths: '',
          improvements: '',
          privateNotes: '',
          status: ReviewStatus.DRAFT,
        },
        include: {
          annotations: { orderBy: { timestamp: 'asc' } },
          session: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  type: true,
                  teacher: { select: { id: true, name: true, email: true } },
                },
              },
              recording: true,
            },
          },
        },
      });
    }

    if (review && user.role === Role.TEACHER) {
      review.privateNotes = '';
    }

    return review;
  }

  private async findDefaultReviewerId(sessionId: string): Promise<string> {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: { course: { include: { reviewerAssignments: true } } },
    });
    if (session?.course.reviewerAssignments.length) {
      return session.course.reviewerAssignments[0].reviewerId;
    }
    const admin = await this.prisma.user.findFirst({ where: { role: Role.ADMIN } });
    if (!admin) throw new NotFoundException('No available reviewer or administrator found');
    return admin.id;
  }

  async saveReview(dto: CreateReviewDto, user: any) {
    const overallScore = (dto.curriculumAdherenceScore + dto.teachingQualityScore + dto.engagementScore) / 3;

    const review = await this.prisma.classReview.findFirst({
      where: { sessionId: dto.sessionId },
    });

    if (review) {
      if (user.role === Role.REVIEWER && review.reviewerId !== user.id) {
        throw new ForbiddenException('You cannot modify reviews created by another reviewer');
      }

      return this.prisma.classReview.update({
        where: { id: review.id },
        data: {
          reviewMode: dto.reviewMode,
          curriculumAdherenceScore: dto.curriculumAdherenceScore,
          teachingQualityScore: dto.teachingQualityScore,
          engagementScore: dto.engagementScore,
          overallScore,
          strengths: dto.strengths,
          improvements: dto.improvements,
          privateNotes: dto.privateNotes,
          isFlagged: dto.isFlagged,
          flagSeverity: dto.flagSeverity,
          flagReason: dto.flagReason,
          status: dto.status,
        },
      });
    } else {
      return this.prisma.classReview.create({
        data: {
          sessionId: dto.sessionId,
          reviewerId: user.id,
          reviewMode: dto.reviewMode,
          curriculumAdherenceScore: dto.curriculumAdherenceScore,
          teachingQualityScore: dto.teachingQualityScore,
          engagementScore: dto.engagementScore,
          overallScore,
          strengths: dto.strengths,
          improvements: dto.improvements,
          privateNotes: dto.privateNotes,
          isFlagged: dto.isFlagged,
          flagSeverity: dto.flagSeverity,
          flagReason: dto.flagReason,
          status: dto.status,
        },
      });
    }
  }

  async addAnnotation(reviewId: string, dto: CreateAnnotationDto, user: any) {
    const review = await this.prisma.classReview.findUnique({
      where: { id: reviewId },
    });
    if (!review) throw new NotFoundException('Review not found');

    if (user.role === Role.REVIEWER && review.reviewerId !== user.id) {
      throw new ForbiddenException('You cannot modify this review');
    }

    return this.prisma.reviewAnnotation.create({
      data: {
        reviewId,
        timestamp: dto.timestamp,
        note: dto.note,
        category: dto.category,
      },
    });
  }

  async deleteAnnotation(annotationId: string, user: any) {
    const annotation = await this.prisma.reviewAnnotation.findUnique({
      where: { id: annotationId },
      include: { review: true },
    });
    if (!annotation) throw new NotFoundException('Annotation not found');

    if (user.role === Role.REVIEWER && annotation.review.reviewerId !== user.id) {
      throw new ForbiddenException('You cannot modify this review');
    }

    return this.prisma.reviewAnnotation.delete({
      where: { id: annotationId },
    });
  }

  async getPendingReviews(user: any) {
    return this.prisma.classSession.findMany({
      where: {
        status: 'COMPLETED',
        course: {
          reviewerAssignments: {
            some: {
              reviewerId: user.id,
              isActive: true,
            },
          },
        },
        OR: [
          {
            classReviews: {
              none: {},
            },
          },
          {
            classReviews: {
              some: {
                status: ReviewStatus.DRAFT,
                reviewerId: user.id,
              },
            },
          },
        ],
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            type: true,
            teacher: { select: { id: true, name: true } },
          },
        },
        recording: true,
        classReviews: {
          where: { reviewerId: user.id },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async getFlaggedReviews() {
    return this.prisma.classReview.findMany({
      where: {
        isFlagged: true,
      },
      include: {
        session: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                type: true,
                teacher: { select: { id: true, name: true, email: true } },
              },
            },
            recording: true,
          },
        },
        reviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }

  async getReviewerHistory(reviewerId: string) {
    return this.prisma.classReview.findMany({
      where: {
        reviewerId,
        status: ReviewStatus.SUBMITTED,
      },
      include: {
        session: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                type: true,
                teacher: { select: { id: true, name: true, email: true } },
              },
            },
            recording: true,
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }

  async findByTeacher(teacherId: string) {
    return this.prisma.classReview.findMany({
      where: {
        session: {
          teacherId,
        },
        status: ReviewStatus.SUBMITTED,
      },
      include: {
        session: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                type: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }
}
