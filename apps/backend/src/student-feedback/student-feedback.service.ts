import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentFeedback, StudentFeedbackDocument } from '../schemas';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class StudentFeedbackService {
  constructor(
    @InjectModel(StudentFeedback.name) private readonly studentFeedbackModel: Model<StudentFeedbackDocument>,
  ) {}

  async create(studentId: string, dto: CreateFeedbackDto) {
    return this.studentFeedbackModel.create({
      studentId,
      ...dto,
    });
  }

  async findMyFeedback(studentId: string) {
    return this.studentFeedbackModel.find({ studentId }).sort({ createdAt: -1 });
  }

  async findAll() {
    return this.studentFeedbackModel.find()
      .populate('student', 'id name email')
      .sort({ createdAt: -1 });
  }

  async updateStatus(id: string, dto: UpdateFeedbackDto) {
    const feedback = await this.studentFeedbackModel.findById(id);

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return this.studentFeedbackModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
  }
}
