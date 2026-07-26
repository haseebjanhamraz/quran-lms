import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@Injectable()
export class StudentFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(studentId: string, dto: CreateFeedbackDto) {
    return this.prisma.studentFeedback.create({
      data: {
        studentId,
        ...dto,
      },
    });
  }

  async findMyFeedback(studentId: string) {
    return this.prisma.studentFeedback.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.studentFeedback.findMany({
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(id: string, dto: UpdateFeedbackDto) {
    const feedback = await this.prisma.studentFeedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    return this.prisma.studentFeedback.update({
      where: { id },
      data: dto,
    });
  }
}
