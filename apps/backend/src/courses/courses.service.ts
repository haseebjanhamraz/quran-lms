import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument, User, UserDocument, Enrollment, EnrollmentDocument, ClassSession, ClassSessionDocument, Role } from '../schemas';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const teacher = await this.userModel.findById(createCourseDto.teacherId);
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('The specified teacher does not exist or does not hold the TEACHER role.');
    }

    const course = await this.courseModel.create({
      title: createCourseDto.title,
      type: createCourseDto.type,
      curriculum: createCourseDto.curriculum,
      teacherId: createCourseDto.teacherId,
    });

    return this.courseModel.findById(course._id).populate('teacher', 'id name email');
  }

  async findAll() {
    return this.courseModel.find().populate('teacher', 'id name email').sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const course = await this.courseModel.findById(id)
      .populate('teacher', 'id name email')
      .populate({
        path: 'enrollments',
        populate: {
          path: 'student',
          select: 'id name email',
        },
      });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.courseModel.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (updateCourseDto.teacherId) {
      const teacher = await this.userModel.findById(updateCourseDto.teacherId);
      if (!teacher || teacher.role !== Role.TEACHER) {
        throw new NotFoundException('The specified teacher does not exist or does not hold the TEACHER role.');
      }
    }

    const updated = await this.courseModel.findByIdAndUpdate(
      id,
      { $set: updateCourseDto },
      { new: true },
    ).populate('teacher', 'id name email');

    return updated;
  }

  async remove(id: string) {
    const course = await this.courseModel.findById(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.courseModel.findByIdAndDelete(id);
  }

  async findByTeacher(teacherId: string) {
    const courses = await this.courseModel.find({ teacherId }).sort({ createdAt: -1 });

    const results = await Promise.all(
      courses.map(async (course) => {
        const [enrollmentCount, sessionCount] = await Promise.all([
          this.enrollmentModel.countDocuments({ courseId: course._id }),
          this.classSessionModel.countDocuments({ courseId: course._id }),
        ]);

        const obj = course.toObject();
        return {
          ...obj,
          _count: {
            enrollments: enrollmentCount,
            classSessions: sessionCount,
          },
        };
      }),
    );

    return results;
  }
}
