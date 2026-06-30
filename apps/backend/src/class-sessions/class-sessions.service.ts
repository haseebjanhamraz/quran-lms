import { ConflictException, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { ClassStatus, Role } from '@prisma/client';
import { AccessToken } from 'livekit-server-sdk';
import { RecordingsService } from '../recordings/recordings.service';

@Injectable()
export class ClassSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly recordingsService: RecordingsService,
  ) {}

  async checkTeacherConflict(
    teacherId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeSessionId?: string,
  ): Promise<boolean> {
    const scheduledTime = new Date(scheduledAt).getTime();
    const endTime = scheduledTime + durationMinutes * 60 * 1000;

    // Load active sessions for the teacher around that day (+/- 24 hours)
    const daySessions = await this.prisma.classSession.findMany({
      where: {
        teacherId,
        status: { in: [ClassStatus.SCHEDULED, ClassStatus.LIVE, ClassStatus.COMPLETED] },
        scheduledAt: {
          gte: new Date(scheduledTime - 24 * 60 * 60 * 1000),
          lte: new Date(endTime + 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const session of daySessions) {
      if (excludeSessionId && session.id === excludeSessionId) {
        continue;
      }

      const existingStart = new Date(session.scheduledAt).getTime();
      const existingEnd = existingStart + session.durationMinutes * 60 * 1000;

      // Check if intervals overlap
      if (scheduledTime < existingEnd && existingStart < endTime) {
        return true;
      }
    }

    return false;
  }

  async create(createClassSessionDto: CreateClassSessionDto) {
    // Validate course
    const course = await this.prisma.course.findUnique({
      where: { id: createClassSessionDto.courseId },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const scheduledDate = new Date(createClassSessionDto.scheduledAt);

    // Check teacher conflicts
    const hasConflict = await this.checkTeacherConflict(
      course.teacherId,
      scheduledDate,
      createClassSessionDto.durationMinutes,
    );

    if (hasConflict) {
      throw new ConflictException(
        'Scheduling conflict: The teacher is already assigned to another class during this time slot.',
      );
    }

    return this.prisma.classSession.create({
      data: {
        courseId: createClassSessionDto.courseId,
        teacherId: course.teacherId,
        scheduledAt: scheduledDate,
        durationMinutes: createClassSessionDto.durationMinutes,
        status: ClassStatus.SCHEDULED,
      },
      include: {
        course: {
          select: { title: true, type: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.classSession.findMany({
      include: {
        course: {
          include: {
            teacher: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            teacher: { select: { id: true, name: true, email: true } },
          },
        },
        attendances: {
          include: {
            user: { select: { id: true, name: true, role: true } },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }
    return session;
  }

  async update(id: string, updateClassSessionDto: UpdateClassSessionDto) {
    const session = await this.prisma.classSession.findUnique({
      where: { id },
    });
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    const newScheduledAt = updateClassSessionDto.scheduledAt
      ? new Date(updateClassSessionDto.scheduledAt)
      : session.scheduledAt;

    let newDuration = updateClassSessionDto.durationMinutes ?? session.durationMinutes;

    // Check conflicts if scheduling is changed
    if (updateClassSessionDto.scheduledAt || updateClassSessionDto.durationMinutes) {
      const hasConflict = await this.checkTeacherConflict(
        session.teacherId,
        newScheduledAt,
        newDuration,
        id,
      );

      if (hasConflict) {
        throw new ConflictException(
          'Scheduling conflict: The teacher is already assigned to another class during this time slot.',
        );
      }
    }

    // If status changes from LIVE to COMPLETED, calculate actual duration and trigger recording upload
    if (updateClassSessionDto.status === ClassStatus.COMPLETED && session.status === ClassStatus.LIVE) {
      const elapsed = Math.round((Date.now() - session.updatedAt.getTime()) / 60000);
      newDuration = Math.max(1, elapsed);
      
      // Trigger recording upload
      try {
        await this.recordingsService.queueUploadJob(
          id,
          `recordings/room-${id}.mp4`,
          `room-${id}.mp4`
        );
      } catch (err: any) {
        Logger.error(`Failed to queue upload job when ending class: ${err.message}`, 'ClassSessionsService');
      }
    }

    return this.prisma.classSession.update({
      where: { id },
      data: {
        scheduledAt: newScheduledAt,
        durationMinutes: newDuration,
        status: updateClassSessionDto.status,
      },
      include: {
        course: {
          select: { title: true },
        },
      },
    });
  }

  async remove(id: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id },
    });
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    // Instead of raw deletion, mark status as CANCELLED to preserve calendar logs
    return this.prisma.classSession.update({
      where: { id },
      data: { status: ClassStatus.CANCELLED },
    });
  }

  async findTeacherCalendar(teacherId: string) {
    return this.prisma.classSession.findMany({
      where: { teacherId },
      include: {
        course: { select: { title: true, type: true } },
        recording: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findStudentCalendar(studentId: string) {
    // Find courses the student is enrolled in
    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId },
      select: { courseId: true },
    });

    const courseIds = enrollments.map((e) => e.courseId);

    return this.prisma.classSession.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        course: { select: { title: true, type: true } },
        recording: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findReviewerCalendar(reviewerId: string) {
    // Find courses assigned to this reviewer
    const assignments = await this.prisma.reviewerAssignment.findMany({
      where: { reviewerId, isActive: true },
      select: { courseId: true },
    });

    const courseIds = assignments.map((a) => a.courseId);

    return this.prisma.classSession.findMany({
      where: {
        courseId: { in: courseIds },
      },
      include: {
        course: { select: { title: true, type: true } },
        recording: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async logAttendance(
    sessionId: string,
    userId: string,
    joinTime?: Date,
    leaveTime?: Date,
    durationSeconds?: number,
  ) {
    const student = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    return this.prisma.attendance.upsert({
      where: {
        sessionId_userId: {
          sessionId,
          userId,
        },
      },
      update: {
        joinTime,
        leaveTime,
        durationSeconds: durationSeconds ?? undefined,
      },
      create: {
        sessionId,
        userId,
        joinTime,
        leaveTime,
        durationSeconds: durationSeconds ?? 0,
      },
    });
  }

  async getAttendance(sessionId: string) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    return this.prisma.attendance.findMany({
      where: { sessionId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async generateLivekitToken(sessionId: string, user: any) {
    const session = await this.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: true,
            reviewerAssignments: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    let isAuthorized = false;
    let isReviewer = false;

    if (user.role === Role.ADMIN) {
      isAuthorized = true;
      isReviewer = true;
    } else if (user.role === Role.TEACHER) {
      isAuthorized = session.teacherId === user.id;
    } else if (user.role === Role.STUDENT) {
      isAuthorized = session.course.enrollments.some((e) => e.studentId === user.id);
    } else if (user.role === Role.REVIEWER) {
      isAuthorized = session.course.reviewerAssignments.some(
        (a) => a.reviewerId === user.id && a.isActive,
      );
      isReviewer = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenException('You are not authorized to join this class session.');
    }

    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    const roomName = `room-${sessionId}`;

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: isReviewer ? `Observer: ${user.name}` : user.name,
    });

    const grants: any = {
      roomJoin: true,
      room: roomName,
    };

    if (isReviewer) {
      grants.canPublish = false;
      grants.canPublishData = false;
      grants.canSubscribe = true;
      grants.hidden = true;
    } else {
      grants.canPublish = true;
      grants.canPublishData = true;
      grants.canSubscribe = true;
      grants.hidden = false;
    }

    token.addGrant(grants);

    if (session.status === ClassStatus.SCHEDULED && user.role === Role.TEACHER) {
      await this.prisma.classSession.update({
        where: { id: sessionId },
        data: { status: ClassStatus.LIVE },
      });
      await this.recordingsService.startRoomRecording(sessionId);
    }

    return {
      token: await token.toJwt(),
      roomName,
      serverUrl: this.configService.get<string>('LIVEKIT_HOST'),
    };
  }

  async getStats(user: any) {
    const role = user.role;
    const userId = user.id;

    if (role === Role.ADMIN) {
      const [total, scheduled, live, completed, cancelled, today] = await Promise.all([
        this.prisma.classSession.count(),
        this.prisma.classSession.count({ where: { status: ClassStatus.SCHEDULED } }),
        this.prisma.classSession.count({ where: { status: ClassStatus.LIVE } }),
        this.prisma.classSession.count({ where: { status: ClassStatus.COMPLETED } }),
        this.prisma.classSession.count({ where: { status: ClassStatus.CANCELLED } }),
        this.prisma.classSession.count({
          where: {
            scheduledAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
      ]);

      const totalTeachers = await this.prisma.user.count({ where: { role: Role.TEACHER } });
      const totalStudents = await this.prisma.user.count({ where: { role: Role.STUDENT } });
      const totalCourses = await this.prisma.course.count();

      return {
        total,
        scheduled,
        live,
        completed,
        cancelled,
        today,
        totalTeachers,
        totalStudents,
        totalCourses,
      };
    }

    if (role === Role.TEACHER) {
      const [total, scheduled, live, completed, cancelled, today, courses] = await Promise.all([
        this.prisma.classSession.count({ where: { teacherId: userId } }),
        this.prisma.classSession.count({ where: { teacherId: userId, status: ClassStatus.SCHEDULED } }),
        this.prisma.classSession.count({ where: { teacherId: userId, status: ClassStatus.LIVE } }),
        this.prisma.classSession.count({ where: { teacherId: userId, status: ClassStatus.COMPLETED } }),
        this.prisma.classSession.count({ where: { teacherId: userId, status: ClassStatus.CANCELLED } }),
        this.prisma.classSession.count({
          where: {
            teacherId: userId,
            scheduledAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lt: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        this.prisma.course.findMany({
          where: { teacherId: userId },
          select: { id: true },
        }),
      ]);

      const completedSessions = await this.prisma.classSession.findMany({
        where: { teacherId: userId, status: ClassStatus.COMPLETED },
        select: { durationMinutes: true },
      });
      const totalMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      const courseIds = courses.map((c) => c.id);
      const studentCountResult = await this.prisma.enrollment.groupBy({
        by: ['studentId'],
        where: { courseId: { in: courseIds } },
      });

      return {
        total,
        scheduled,
        live,
        completed,
        cancelled,
        today,
        totalHours: Math.round(totalMinutes / 60),
        totalStudents: studentCountResult.length,
      };
    }

    if (role === Role.STUDENT) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { studentId: userId },
        select: { courseId: true },
      });
      const courseIds = enrollments.map((e) => e.courseId);

      const [total, scheduled, live, completed, cancelled] = await Promise.all([
        this.prisma.classSession.count({ where: { courseId: { in: courseIds } } }),
        this.prisma.classSession.count({ where: { courseId: { in: courseIds }, status: ClassStatus.SCHEDULED } }),
        this.prisma.classSession.count({ where: { courseId: { in: courseIds }, status: ClassStatus.LIVE } }),
        this.prisma.classSession.count({ where: { courseId: { in: courseIds }, status: ClassStatus.COMPLETED } }),
        this.prisma.classSession.count({ where: { courseId: { in: courseIds }, status: ClassStatus.CANCELLED } }),
      ]);

      const completedSessions = await this.prisma.classSession.findMany({
        where: { courseId: { in: courseIds }, status: ClassStatus.COMPLETED },
        select: { durationMinutes: true },
      });
      const totalMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      return {
        total,
        scheduled,
        live,
        completed,
        cancelled,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        enrolledCourses: courseIds.length,
      };
    }

    if (role === Role.REVIEWER) {
      const assignments = await this.prisma.reviewerAssignment.findMany({
        where: { reviewerId: userId, isActive: true },
        select: { courseId: true },
      });
      const courseIds = assignments.map((a) => a.courseId);

      const [total, pendingCount, flaggedCount] = await Promise.all([
        this.prisma.classSession.count({ where: { courseId: { in: courseIds } } }),
        this.prisma.classSession.count({
          where: {
            courseId: { in: courseIds },
            status: ClassStatus.COMPLETED,
            classReviews: {
              none: {
                status: 'SUBMITTED',
              },
            },
          },
        }),
        this.prisma.classReview.count({
          where: {
            reviewerId: userId,
            isFlagged: true,
          },
        }),
      ]);

      const completedReviews = await this.prisma.classReview.count({
        where: {
          reviewerId: userId,
          status: 'SUBMITTED',
        },
      });

      const reviews = await this.prisma.classReview.findMany({
        where: { reviewerId: userId },
        select: { overallScore: true },
      });
      const avgScore = reviews.length
        ? Math.round((reviews.reduce((acc, r) => acc + r.overallScore, 0) / reviews.length) * 10) / 10
        : 0;

      return {
        total,
        pending: pendingCount,
        flagged: flaggedCount,
        completedReviews,
        avgScore,
      };
    }

    return {};
  }
}
