import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReviewerAssignment, ReviewerAssignmentDocument, User, UserDocument, Course, CourseDocument, Role } from '../schemas';
import { CreateReviewerAssignmentDto } from './dto/create-reviewer-assignment.dto';

@Injectable()
export class ReviewerAssignmentsService {
  constructor(
    @InjectModel(ReviewerAssignment.name) private readonly reviewerAssignmentModel: Model<ReviewerAssignmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  async create(createDto: CreateReviewerAssignmentDto) {
    const reviewer = await this.userModel.findById(createDto.reviewerId);
    if (!reviewer || reviewer.role !== Role.REVIEWER) {
      throw new NotFoundException('The specified reviewer does not exist or does not hold the REVIEWER role.');
    }

    const course = await this.courseModel.findById(createDto.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.reviewerAssignmentModel.findOne({
      reviewerId: createDto.reviewerId,
      courseId: createDto.courseId,
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Reviewer is already assigned to this course.');
      } else {
        return this.reviewerAssignmentModel.findByIdAndUpdate(
          existing._id,
          { $set: { isActive: true } },
          { new: true },
        );
      }
    }

    const created = await this.reviewerAssignmentModel.create({
      reviewerId: createDto.reviewerId,
      courseId: createDto.courseId,
      isActive: true,
    });

    return this.reviewerAssignmentModel.findById(created._id)
      .populate('reviewer', 'id name email')
      .populate('course', 'id title');
  }

  async findAll() {
    return this.reviewerAssignmentModel.find({ isActive: true })
      .populate('reviewer', 'id name email')
      .populate('course', 'id title');
  }

  async remove(id: string) {
    const assignment = await this.reviewerAssignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.reviewerAssignmentModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    );
  }

  async findByReviewer(reviewerId: string) {
    return this.reviewerAssignmentModel.find({ reviewerId, isActive: true })
      .populate({
        path: 'course',
        select: 'id title type',
        populate: { path: 'teacher', select: 'id name email' },
      });
  }
}
