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

  async getStats() {
    const [total, recent] = await Promise.all([
      this.prisma.enrollment.count(),
      this.prisma.enrollment.count({
        where: {
          enrolledAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    const breakdown = await this.prisma.enrollment.groupBy({
      by: ['courseId'],
      _count: {
        id: true,
      },
    });

    const courses = await this.prisma.course.findMany({
      select: { id: true, type: true },
    });

    const typeCounts: Record<string, number> = {
      NAZIRA: 0,
      TAJWEED: 0,
      HIFZ_UL_QURAN: 0,
      ISLAMIC_STUDIES: 0,
    };

    for (const b of breakdown) {
      const course = courses.find((c) => c.id === b.courseId);
      if (course) {
        typeCounts[course.type] = (typeCounts[course.type] || 0) + b._count.id;
      }
    }

    return {
      total,
      recent,
      byType: typeCounts,
    };
  }

  async findByStudent(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            teacher: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }
}
