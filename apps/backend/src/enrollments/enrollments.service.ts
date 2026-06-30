import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: createEnrollmentDto.studentId },
    });
    if (!student || student.role !== 'STUDENT') {
      throw new NotFoundException('The specified student does not exist or does not hold the STUDENT role.');
    }

    const course = await this.prisma.course.findUnique({
      where: { id: createEnrollmentDto.courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: createEnrollmentDto.studentId,
          courseId: createEnrollmentDto.courseId,
        },
      },
    });
    if (existingEnrollment) {
      throw new ConflictException('Student is already enrolled in this course.');
    }

    return this.prisma.enrollment.create({
      data: {
        studentId: createEnrollmentDto.studentId,
        courseId: createEnrollmentDto.courseId,
      },
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.enrollment.findMany({
      include: {
        student: {
          select: { id: true, name: true, email: true },
        },
        course: {
          select: { id: true, title: true, type: true },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }

  async remove(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });
    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.prisma.enrollment.delete({
      where: { id },
    });
  }
}
