import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Course, CourseDocument, User, UserDocument, Enrollment, EnrollmentDocument, ClassSession, ClassSessionDocument, SubjectCategory, SubjectCategoryDocument, Role } from '../schemas';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(SubjectCategory.name) private readonly categoryModel: Model<SubjectCategoryDocument>,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    const rawTeacherIds = createCourseDto.teacherIds || (createCourseDto.teacherId ? [createCourseDto.teacherId] : []);
    if (rawTeacherIds.length === 0 && createCourseDto.teacherId) {
      rawTeacherIds.push(createCourseDto.teacherId);
    }

    const primaryTeacherId = rawTeacherIds[0] || createCourseDto.teacherId;

    const course = await this.courseModel.create({
      title: createCourseDto.title,
      type: createCourseDto.type,
      curriculum: createCourseDto.curriculum,
      teacherId: primaryTeacherId,
      teacherIds: rawTeacherIds,
    });

    return this.courseModel.findById(course._id)
      .populate('teacher', 'id name email')
      .populate('teachers', 'id name email');
  }

  async findAll() {
    return this.courseModel.find()
      .populate('teacher', 'id name email')
      .populate('teachers', 'id name email')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const course = await this.courseModel.findById(id)
      .populate('teacher', 'id name email')
      .populate('teachers', 'id name email')
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

    const updatePayload: any = { ...updateCourseDto };
    if (updateCourseDto.teacherIds && updateCourseDto.teacherIds.length > 0) {
      updatePayload.teacherId = updateCourseDto.teacherIds[0];
      updatePayload.teacherIds = updateCourseDto.teacherIds;
    } else if (updateCourseDto.teacherId) {
      updatePayload.teacherId = updateCourseDto.teacherId;
      updatePayload.teacherIds = [updateCourseDto.teacherId];
    }

    const updated = await this.courseModel.findByIdAndUpdate(
      id,
      { $set: updatePayload },
      { new: true },
    )
      .populate('teacher', 'id name email')
      .populate('teachers', 'id name email');

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
    const courses = await this.courseModel.find({
      $or: [{ teacherId }, { teacherIds: teacherId }],
    }).sort({ createdAt: -1 });

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

  async assignCoursesToTeacher(teacherId: string, courseIds: string[]) {
    const teacher = await this.userModel.findById(teacherId);
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Specified teacher does not exist.');
    }

    // Assign teacher to selected courses
    if (courseIds && courseIds.length > 0) {
      await this.courseModel.updateMany(
        { _id: { $in: courseIds } },
        {
          $addToSet: { teacherIds: teacherId },
          $set: { teacherId: teacherId },
        },
      );
    }

    // Unassign teacher from courses not in courseIds
    await this.courseModel.updateMany(
      { _id: { $nin: courseIds || [] }, $or: [{ teacherId }, { teacherIds: teacherId }] },
      {
        $pull: { teacherIds: teacherId },
      },
    );

    return this.findByTeacher(teacherId);
  }

  // --- Subject Category Methods ---
  async findAllCategories() {
    let categories = await this.categoryModel.find().sort({ createdAt: 1 });
    if (categories.length === 0) {
      // Seed default categories
      await this.categoryModel.insertMany([
        { name: 'Nazira & Recitation', code: 'NAZIRA', description: 'Fundamental Quranic reading and fluency for beginners', color: '#3b82f6' },
        { name: 'Tajweed & Makharij', code: 'TAJWEED', description: 'Rules of pronunciation, articulation points, and voice modulation', color: '#10b981' },
        { name: 'Hifz-ul-Quran Intensive', code: 'HIFZ_UL_QURAN', description: 'Full Quran memorization program with daily revision track', color: '#8b5cf6' },
        { name: 'Hadith & Islamic Studies', code: 'ISLAMIC_STUDIES', description: 'Seerah, Fiqh essentials, and daily Islamic etiquette', color: '#f59e0b' },
      ]);
      categories = await this.categoryModel.find().sort({ createdAt: 1 });
    }
    return categories;
  }

  async createCategory(dto: any) {
    return this.categoryModel.create(dto);
  }

  async updateCategory(id: string, dto: any) {
    const cat = await this.categoryModel.findById(id);
    if (!cat) throw new NotFoundException('Subject category not found');
    return this.categoryModel.findByIdAndUpdate(id, { $set: dto }, { new: true });
  }

  async removeCategory(id: string) {
    const cat = await this.categoryModel.findById(id);
    if (!cat) throw new NotFoundException('Subject category not found');
    return this.categoryModel.findByIdAndDelete(id);
  }
}
