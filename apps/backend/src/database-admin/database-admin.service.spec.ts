import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseAdminService } from './database-admin.service';
import { DatabaseAdminController } from './database-admin.controller';
import { BadRequestException } from '@nestjs/common';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { Role } from '../schemas';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RedisCacheService } from '../cache/redis-cache.service';

describe('DatabaseAdminModule Unit Tests', () => {
  let service: DatabaseAdminService;
  let controller: DatabaseAdminController;

  const mockModel = () => ({
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    create: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(5),
    deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
    distinct: jest.fn().mockResolvedValue(['id1', 'id2']),
    select: jest.fn().mockResolvedValue([]),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
  });

  const schemaNames = [
    'User', 'Teacher', 'Student', 'Course', 'Enrollment',
    'ClassSession', 'WeeklyScheduleSlot', 'Attendance', 'Recording',
    'TranscriptSegment', 'ClassReview', 'AIReport', 'RescheduleRequest',
    'SupervisorAssignment', 'ReviewerAssignment', 'StudentFeedback',
    'FeeStructure', 'Invoice', 'Expense', 'Income', 'SalaryPayment',
    'SalarySlip', 'SalaryConfig', 'LeaveRequest', 'LeaveBalance',
    'Ticket', 'TicketComment', 'Notification', 'Material', 'SubjectCategory',
    'AuditLog', 'PipelineLog', 'Counter', 'Permission', 'RolePermission',
    'SystemSetting',
  ];

  beforeEach(async () => {
    const providers: any[] = [
      DatabaseAdminService,
      {
        provide: getConnectionToken(),
        useValue: {
          db: {
            listCollections: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) }),
            collection: jest.fn().mockReturnValue({ drop: jest.fn() }),
          },
        },
      },
      {
        provide: AuditLogsService,
        useValue: {
          log: jest.fn().mockResolvedValue({}),
        },
      },
      {
        provide: RedisCacheService,
        useValue: {
          delByPattern: jest.fn().mockResolvedValue(undefined),
        },
      },
      ...schemaNames.map((name) => ({
        provide: getModelToken(name),
        useValue: mockModel(),
      })),
    ];

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DatabaseAdminController],
      providers,
    }).compile();

    service = module.get<DatabaseAdminService>(DatabaseAdminService);
    controller = module.get<DatabaseAdminController>(DatabaseAdminController);
  });

  it('service and controller should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  it('should return database stats structure with all categories', async () => {
    const stats = await service.getDatabaseStats();
    expect(stats.success).toBe(true);
    expect(stats.totalRecords).toBeGreaterThan(0);
    expect(stats.categories).toBeDefined();
    expect(stats.categories.students).toBeDefined();
    expect(stats.categories.teachers).toBeDefined();
    expect(stats.categories.courses).toBeDefined();
    expect(stats.categories.classes_sessions).toBeDefined();
    expect(stats.categories.finance).toBeDefined();
  });

  it('cleanup should throw BadRequestException if confirmation is not CONFIRM or CLEANUP', async () => {
    await expect(
      service.cleanup(['students'], 'WRONG_TEXT', { email: 'admin@lms.com' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('cleanup should throw BadRequestException if targets list is empty', async () => {
    await expect(
      service.cleanup([], 'CLEANUP', { email: 'admin@lms.com' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('cleanup should succeed with valid target and confirmation', async () => {
    const res = await service.cleanup(['finance'], 'CONFIRM', { email: 'admin@lms.com' });
    expect(res.success).toBe(true);
    expect(res.deletedCounts).toBeDefined();
  });

  it('seed should throw BadRequestException if seed type is invalid', async () => {
    await expect(
      service.seed('invalid_type' as any, { email: 'admin@lms.com' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('controller stats endpoint should return stats', async () => {
    const res = await controller.getDatabaseStats();
    expect(res.success).toBe(true);
  });

  it('controller cleanup endpoint should invoke service', async () => {
    const adminUser = { email: 'ceo@lms.com', role: Role.SUPER_ADMIN } as any;
    const res = await controller.cleanupDatabase(
      { targets: ['materials'], confirmation: 'CLEANUP' },
      adminUser,
    );
    expect(res.success).toBe(true);
  });
});
