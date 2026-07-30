import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SupervisorAssignment, SupervisorAssignmentDocument, User, UserDocument, Course, CourseDocument, Role } from '../schemas';
import { CreateSupervisorAssignmentDto } from './dto/create-supervisor-assignment.dto';

@Injectable()
export class SupervisorAssignmentsService {
  constructor(
    @InjectModel(SupervisorAssignment.name) private readonly supervisorAssignmentModel: Model<SupervisorAssignmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  async create(createDto: CreateSupervisorAssignmentDto) {
    const supervisor = await this.userModel.findById(createDto.supervisorId);
    if (!supervisor || supervisor.role !== Role.SUPERVISOR) {
      throw new NotFoundException('The specified supervisor does not exist or does not hold the SUPERVISOR role.');
    }

    const course = await this.courseModel.findById(createDto.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existing = await this.supervisorAssignmentModel.findOne({
      supervisorId: createDto.supervisorId,
      courseId: createDto.courseId,
    });

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Supervisor is already assigned to this course.');
      } else {
        return this.supervisorAssignmentModel.findByIdAndUpdate(
          existing._id,
          { $set: { isActive: true } },
          { new: true },
        );
      }
    }

    const created = await this.supervisorAssignmentModel.create({
      supervisorId: createDto.supervisorId,
      courseId: createDto.courseId,
      isActive: true,
    });

    return this.supervisorAssignmentModel.findById(created._id)
      .populate('supervisor', 'id name email')
      .populate('course', 'id title');
  }

  async findAll() {
    return this.supervisorAssignmentModel.find({ isActive: true })
      .populate('supervisor', 'id name email')
      .populate('course', 'id title');
  }

  async remove(id: string) {
    const assignment = await this.supervisorAssignmentModel.findById(id);
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.supervisorAssignmentModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    );
  }

  async findBySupervisor(supervisorId: string) {
    return this.supervisorAssignmentModel.find({ supervisorId, isActive: true })
      .populate({
        path: 'course',
        select: 'id title type',
        populate: { path: 'teacher', select: 'id name email' },
      });
  }
}
