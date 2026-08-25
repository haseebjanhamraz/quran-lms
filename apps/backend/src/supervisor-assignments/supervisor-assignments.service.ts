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
    if (!supervisor || (supervisor.role !== Role.SUPERVISOR && supervisor.role !== Role.ADMIN && supervisor.role !== Role.SUPER_ADMIN)) {
      throw new NotFoundException('The specified supervisor does not exist or does not hold the SUPERVISOR role.');
    }

    if (!createDto.teacherId && !createDto.courseId) {
      throw new ConflictException('A teacherId or courseId must be provided to create a supervisor assignment.');
    }

    if (createDto.teacherId) {
      const teacher = await this.userModel.findById(createDto.teacherId);
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }
    }

    if (createDto.courseId) {
      const course = await this.courseModel.findById(createDto.courseId);
      if (!course) {
        throw new NotFoundException('Course not found');
      }
    }

    const query: any = { supervisorId: createDto.supervisorId };
    if (createDto.teacherId) query.teacherId = createDto.teacherId;
    if (createDto.courseId) query.courseId = createDto.courseId;

    const existing = await this.supervisorAssignmentModel.findOne(query);

    if (existing) {
      if (existing.isActive) {
        throw new ConflictException('Supervisor is already assigned to this teacher / course.');
      } else {
        return this.supervisorAssignmentModel.findByIdAndUpdate(
          existing._id,
          { $set: { isActive: true } },
          { new: true },
        ).populate('supervisor', 'id name email')
         .populate('teacher', 'id name email')
         .populate('course', 'id title');
      }
    }

    const created = await this.supervisorAssignmentModel.create({
      supervisorId: createDto.supervisorId,
      teacherId: createDto.teacherId || undefined,
      courseId: createDto.courseId || undefined,
      isActive: true,
    });

    return this.supervisorAssignmentModel.findById(created._id)
      .populate('supervisor', 'id name email')
      .populate('teacher', 'id name email')
      .populate('course', 'id title');
  }

  async findAll() {
    return this.supervisorAssignmentModel.find({ isActive: true })
      .populate('supervisor', 'id name email')
      .populate('teacher', 'id name email')
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
      .populate('teacher', 'id name email profilePicture')
      .populate({
        path: 'course',
        select: 'id title type',
        populate: { path: 'teacher', select: 'id name email' },
      });
  }
}
