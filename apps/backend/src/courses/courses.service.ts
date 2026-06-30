import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    const teacher = await this.prisma.user.findUnique({
      where: { id: createCourseDto.teacherId },
    });
    if (!teacher || teacher.role !== 'TEACHER') {
      throw new NotFoundException('The specified teacher does not exist or does not hold the TEACHER role.');
    }

    return this.prisma.course.create({
      data: {
        title: createCourseDto.title,
        type: createCourseDto.type,
        curriculum: createCourseDto.curriculum,
        teacherId: createCourseDto.teacherId,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.course.findMany({
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        enrollments: {
          include: {
            student: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (updateCourseDto.teacherId) {
      const teacher = await this.prisma.user.findUnique({
        where: { id: updateCourseDto.teacherId },
      });
      if (!teacher || teacher.role !== 'TEACHER') {
        throw new NotFoundException('The specified teacher does not exist or does not hold the TEACHER role.');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return this.prisma.course.delete({
      where: { id },
    });
  }
}
