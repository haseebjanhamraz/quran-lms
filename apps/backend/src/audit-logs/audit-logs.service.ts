import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(action: string, userId?: string, metadata?: any) {
    return this.prisma.auditLog.create({
      data: {
        action,
        userId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  }

  async findAll(limit = 100, page = 1) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      total,
      limit,
      page,
    };
  }
}
