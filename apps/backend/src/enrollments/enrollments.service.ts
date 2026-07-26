import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Enrollment, EnrollmentDocument, User, UserDocument, Course, CourseDocument, Role } from '../schemas';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const student = await this.userModel.findById(createEnrollmentDto.studentId);
    if (!student || student.role !== Role.STUDENT) {
      throw new NotFoundException('The specified student does not exist or does not hold the STUDENT role.');
    }

    const course = await this.courseModel.findById(createEnrollmentDto.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingEnrollment = await this.enrollmentModel.findOne({
      studentId: createEnrollmentDto.studentId,
      courseId: createEnrollmentDto.courseId,
    });
    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course.');
    }

    const created = await this.enrollmentModel.create({
      studentId: createEnrollmentDto.studentId,
      courseId: createEnrollmentDto.courseId,
    });

    return this.enrollmentModel.findById(created._id)
      .populate('student', 'id name email')
      .populate('course', 'id title');
  }

  async findAll() {
    return this.enrollmentModel.find()
      .populate('student', 'id name email')
      .populate('course', 'id title type')
      .sort({ enrolledAt: -1 });
  }

  async remove(id: string) {
    const enrollment = await this.enrollmentModel.findById(id);
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.enrollmentModel.findByIdAndDelete(id);
  }

  async getStats() {
    const [total, recent] = await Promise.all([
      this.enrollmentModel.countDocuments(),
      this.enrollmentModel.countDocuments({
        enrolledAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const breakdown = await this.enrollmentModel.aggregate([
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]);

    const courses = await this.courseModel.find({}, 'id type');

    const typeCounts: Record<string, number> = {
      NAZIRA: 0,
      TAJWEED: 0,
      HIFZ_UL_QURAN: 0,
      ISLAMIC_STUDIES: 0,
    };

    for (const b of breakdown) {
      const course = courses.find((c) => c._id.toString() === b._id.toString());
      if (course) {
        typeCounts[course.type] = (typeCounts[course.type] || 0) + b.count;
      }
    }

    return {
      total,
      recent,
      byType: typeCounts,
    };
  }

  async findByStudent(studentId: string) {
    return this.enrollmentModel.find({ studentId })
      .populate({
        path: 'course',
        populate: {
          path: 'teacher',
          select: 'id name email',
        },
      })
      .sort({ enrolledAt: -1 });
  }
}
