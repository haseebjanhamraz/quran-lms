import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ClassReview, ClassReviewDocument, ReviewStatus, ReviewMode,
  ClassSession, ClassSessionDocument, ClassStatus,
  ReviewerAssignment, ReviewerAssignmentDocument,
  User, UserDocument, Role
} from '../schemas';
import { CreateReviewDto } from './dto/create-review.dto';
import { CreateAnnotationDto } from './dto/create-annotation.dto';

@Injectable()
export class ClassReviewsService {
  constructor(
    @InjectModel(ClassReview.name) private readonly classReviewModel: Model<ClassReviewDocument>,
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(ReviewerAssignment.name) private readonly reviewerAssignmentModel: Model<ReviewerAssignmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getReviewBySession(sessionId: string, user: any) {
    const session = await this.classSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    if (user.role === Role.REVIEWER) {
      const assigned = await this.reviewerAssignmentModel.findOne({
        reviewerId: user.id,
        courseId: session.courseId,
        isActive: true,
      });
      if (!assigned) {
        throw new ForbiddenException('You are not assigned to review this course');
      }
    } else if (user.role === Role.TEACHER) {
      if (session.teacherId.toString() !== user.id) {
        throw new ForbiddenException('You are not authorized to view reviews for this session');
      }
    }

    let review = await this.classReviewModel.findOne({ sessionId })
      .populate({
        path: 'session',
        populate: [
          {
            path: 'course',
            select: 'id title type',
            populate: { path: 'teacher', select: 'id name email' },
          },
          { path: 'recording' },
        ],
      });

    if (!review) {
      const reviewerId = user.role === Role.REVIEWER ? user.id : (await this.findDefaultReviewerId(sessionId));
      const created = await this.classReviewModel.create({
        sessionId,
        reviewerId,
        reviewMode: ReviewMode.RECORDING_REVIEW,
        curriculumAdherenceScore: 5,
        teachingQualityScore: 5,
        engagementScore: 5,
        overallScore: 5.0,
        strengths: '',
        improvements: '',
        privateNotes: '',
        status: ReviewStatus.DRAFT,
      });

      review = await this.classReviewModel.findById(created._id).populate({
        path: 'session',
        populate: [
          {
            path: 'course',
            select: 'id title type',
            populate: { path: 'teacher', select: 'id name email' },
          },
          { path: 'recording' },
        ],
      });
    }

    if (!review) {
      throw new NotFoundException('Failed to initialize review for session');
    }

    const result = review.toObject ? review.toObject() : review;
    if (user.role === Role.TEACHER) {
      result.privateNotes = '';
    }

    return result;
  }

  private async findDefaultReviewerId(sessionId: string): Promise<string> {
    const session = await this.classSessionModel.findById(sessionId);
    if (session) {
      const assignment = await this.reviewerAssignmentModel.findOne({ courseId: session.courseId, isActive: true });
      if (assignment) {
        return assignment.reviewerId.toString();
      }
    }
    const admin = await this.userModel.findOne({ role: Role.ADMIN });
    if (!admin) throw new NotFoundException('No available reviewer or administrator found');
    return admin._id.toString();
  }

  async saveReview(dto: CreateReviewDto, user: any) {
    const overallScore = (dto.curriculumAdherenceScore + dto.teachingQualityScore + dto.engagementScore) / 3;

    const review = await this.classReviewModel.findOne({ sessionId: dto.sessionId });

    if (review) {
      if (user.role === Role.REVIEWER && review.reviewerId.toString() !== user.id) {
        throw new ForbiddenException('You cannot modify reviews created by another reviewer');
      }

      return this.classReviewModel.findByIdAndUpdate(
        review._id,
        {
          $set: {
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
        },
        { new: true },
      );
    } else {
      return this.classReviewModel.create({
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
      });
    }
  }

  async addAnnotation(reviewId: string, dto: CreateAnnotationDto, user: any) {
    const review = await this.classReviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    if (user.role === Role.REVIEWER && review.reviewerId.toString() !== user.id) {
      throw new ForbiddenException('You cannot modify this review');
    }

    const updated = await this.classReviewModel.findByIdAndUpdate(
      reviewId,
      {
        $push: {
          annotations: {
            timestamp: dto.timestamp,
            note: dto.note,
            category: dto.category,
            createdAt: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!updated || !updated.annotations) {
      throw new NotFoundException('Failed to add annotation');
    }

    return updated.annotations[updated.annotations.length - 1];
  }

  async deleteAnnotation(annotationId: string, user: any) {
    const review = await this.classReviewModel.findOne({ 'annotations._id': annotationId });
    if (!review) throw new NotFoundException('Annotation not found');

    if (user.role === Role.REVIEWER && review.reviewerId.toString() !== user.id) {
      throw new ForbiddenException('You cannot modify this review');
    }

    await this.classReviewModel.findByIdAndUpdate(review._id, {
      $pull: { annotations: { _id: annotationId } },
    });

    return { success: true };
  }

  async getPendingReviews(user: any) {
    const assignments = await this.reviewerAssignmentModel.find({ reviewerId: user.id, isActive: true }, 'courseId');
    const courseIds = assignments.map((a) => a.courseId);

    const sessions = await this.classSessionModel.find({
      status: ClassStatus.COMPLETED,
      courseId: { $in: courseIds },
    })
      .populate({
        path: 'course',
        select: 'id title type',
        populate: { path: 'teacher', select: 'id name' },
      })
      .populate('recording')
      .populate('classReviews')
      .sort({ scheduledAt: -1 });

    // Filter sessions: either no reviews OR draft review by this reviewer
    return sessions.filter((s: any) => {
      const reviews: any[] = s.get ? s.get('classReviews') : (s as any).classReviews || [];
      if (!reviews.length) return true;
      return reviews.some((r: any) => r.reviewerId.toString() === user.id && r.status === ReviewStatus.DRAFT);
    });
  }

  async getFlaggedReviews() {
    return this.classReviewModel.find({ isFlagged: true })
      .populate({
        path: 'session',
        populate: [
          {
            path: 'course',
            select: 'id title type',
            populate: { path: 'teacher', select: 'id name email' },
          },
          { path: 'recording' },
        ],
      })
      .populate('reviewer', 'id name email')
      .sort({ reviewedAt: -1 });
  }

  async getReviewerHistory(reviewerId: string) {
    return this.classReviewModel.find({
      reviewerId,
      status: ReviewStatus.SUBMITTED,
    })
      .populate({
        path: 'session',
        populate: [
          {
            path: 'course',
            select: 'id title type',
            populate: { path: 'teacher', select: 'id name email' },
          },
          { path: 'recording' },
        ],
      })
      .sort({ reviewedAt: -1 });
  }

  async findByTeacher(teacherId: string) {
    const sessions = await this.classSessionModel.find({ teacherId }, '_id');
    const sessionIds = sessions.map((s) => s._id);

    return this.classReviewModel.find({
      sessionId: { $in: sessionIds },
      status: ReviewStatus.SUBMITTED,
    })
      .populate({
        path: 'session',
        populate: { path: 'course', select: 'id title type' },
      })
      .populate('reviewer', 'id name')
      .sort({ reviewedAt: -1 });
  }
}
