import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../schemas';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(action: string, userId?: string, metadata?: any) {
    return this.auditLogModel.create({
      action,
      userId: userId || undefined,
      metadata: metadata || undefined,
    });
  }

  async findAll(limit = 100, page = 1) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.auditLogModel.find()
        .populate('user', 'id name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.auditLogModel.countDocuments(),
    ]);

    return {
      data: logs,
      total,
      limit,
      page,
    };
  }
}
