import { ConflictException, Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { CreateClassSessionDto } from './dto/create-class-session.dto';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import {
  ClassSession, ClassSessionDocument, ClassStatus,
  Course, CourseDocument,
  User, UserDocument, Role,
  Attendance, AttendanceDocument,
  PipelineLog, PipelineLogDocument,
  Enrollment, EnrollmentDocument,
  ReviewerAssignment, ReviewerAssignmentDocument,
  ClassReview, ClassReviewDocument, ReviewStatus
} from '../schemas';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { RecordingsService } from '../recordings/recordings.service';
import { LocalStorageService } from '../local-storage/local-storage.service';

@Injectable()
export class ClassSessionsService {
  constructor(
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(PipelineLog.name) private readonly pipelineLogModel: Model<PipelineLogDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(ReviewerAssignment.name) private readonly reviewerAssignmentModel: Model<ReviewerAssignmentDocument>,
    @InjectModel(ClassReview.name) private readonly classReviewModel: Model<ClassReviewDocument>,
    private readonly configService: ConfigService,
    private readonly recordingsService: RecordingsService,
    private readonly localStorageService: LocalStorageService,
  ) {}

  async checkTeacherConflict(
    teacherId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeSessionId?: string,
  ): Promise<boolean> {
    const scheduledTime = new Date(scheduledAt).getTime();
    const endTime = scheduledTime + durationMinutes * 60 * 1000;

    const daySessions = await this.classSessionModel.find({
      teacherId,
      status: { $in: [ClassStatus.SCHEDULED, ClassStatus.LIVE, ClassStatus.COMPLETED] },
      scheduledAt: {
        $gte: new Date(scheduledTime - 24 * 60 * 60 * 1000),
        $lte: new Date(endTime + 24 * 60 * 60 * 1000),
      },
    });

    for (const session of daySessions) {
      if (excludeSessionId && session._id.toString() === excludeSessionId) {
        continue;
      }

      const existingStart = new Date(session.scheduledAt).getTime();
      const existingEnd = existingStart + session.durationMinutes * 60 * 1000;

      if (scheduledTime < existingEnd && existingStart < endTime) {
        return true;
      }
    }

    return false;
  }

  async create(createClassSessionDto: CreateClassSessionDto) {
    const course = await this.courseModel.findById(createClassSessionDto.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const scheduledDate = new Date(createClassSessionDto.scheduledAt);
    const teacherId = createClassSessionDto.teacherId || course.teacherId.toString();

    const hasConflict = await this.checkTeacherConflict(
      teacherId,
      scheduledDate,
      createClassSessionDto.durationMinutes,
    );

    if (hasConflict) {
      throw new ConflictException(
        'Scheduling conflict: The teacher is already assigned to another class during this time slot.',
      );
    }

    const created = await this.classSessionModel.create({
      courseId: createClassSessionDto.courseId,
      teacherId: teacherId,
      studentId: createClassSessionDto.studentId,
      scheduledAt: scheduledDate,
      durationMinutes: createClassSessionDto.durationMinutes,
      status: ClassStatus.SCHEDULED,
    });

    return this.classSessionModel.findById(created._id).populate('course', 'title type');
  }

  async findAll() {
    return this.classSessionModel.find()
      .populate({
        path: 'course',
        populate: { path: 'teacher', select: 'id name' },
      })
      .sort({ scheduledAt: 1 });
  }

  async findOne(id: string) {
    const session = await this.classSessionModel.findById(id)
      .populate({
        path: 'course',
        populate: { path: 'teacher', select: 'id name email' },
      })
      .populate({
        path: 'attendances',
        populate: { path: 'user', select: 'id name role' },
      });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }
    return session;
  }

  async update(id: string, updateClassSessionDto: UpdateClassSessionDto) {
    const session = await this.classSessionModel.findById(id);
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    const newScheduledAt = updateClassSessionDto.scheduledAt
      ? new Date(updateClassSessionDto.scheduledAt)
      : session.scheduledAt;

    let newDuration = updateClassSessionDto.durationMinutes ?? session.durationMinutes;

    if (updateClassSessionDto.scheduledAt || updateClassSessionDto.durationMinutes) {
      const hasConflict = await this.checkTeacherConflict(
        session.teacherId.toString(),
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

    let startedAt = session.startedAt;

    if (updateClassSessionDto.status === ClassStatus.LIVE && session.status === ClassStatus.SCHEDULED) {
      startedAt = new Date();
    }

    if (updateClassSessionDto.status === ClassStatus.COMPLETED && session.status === ClassStatus.LIVE) {
      const updatedAtTime = session.updatedAt ? session.updatedAt.getTime() : Date.now();
      const elapsed = Math.round((Date.now() - updatedAtTime) / 60000);
      newDuration = Math.max(1, elapsed);

      try {
        const livekitHost = this.configService.getOrThrow<string>('LIVEKIT_HOST');
        const apiKey = this.configService.getOrThrow<string>('LIVEKIT_API_KEY');
        const apiSecret = this.configService.getOrThrow<string>('LIVEKIT_API_SECRET');
        const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
        await roomService.deleteRoom(`room-${id}`);
        Logger.log(`Successfully deleted LiveKit room room-${id} and disconnected all participants`, 'ClassSessionsService');
      } catch (err: any) {
        Logger.error(`Failed to delete LiveKit room room-${id}: ${err.message}`, 'ClassSessionsService');
      }
    }

    return this.classSessionModel.findByIdAndUpdate(
      id,
      {
        $set: {
          scheduledAt: newScheduledAt,
          durationMinutes: newDuration,
          status: updateClassSessionDto.status,
          startedAt,
        },
      },
      { new: true },
    ).populate('course', 'title');
  }

  async remove(id: string) {
    const session = await this.classSessionModel.findById(id).populate('recording');
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    const recording: any = session.get ? session.get('recording') : (session as any).recording;
    if (recording?.filePath) {
      try {
        await this.localStorageService.deleteFile(recording.filePath);
        Logger.log(`Successfully deleted local recording file for session: ${id}`, 'ClassSessionsService');
      } catch (err: any) {
        Logger.error(`Failed to delete local recording file for session ${id}: ${err.message}`, 'ClassSessionsService');
      }
    }

    return this.classSessionModel.findByIdAndDelete(id);
  }

  async getPipelineLogs(sessionId: string) {
    return this.pipelineLogModel.find({ sessionId }).sort({ createdAt: 1 });
  }

  async logPipelineStep(sessionId: string, step: string, status: string, message: string) {
    try {
      await this.pipelineLogModel.create({ sessionId, step, status, message });
    } catch (err: any) {
      Logger.error(`Failed to create pipeline log for session ${sessionId}: ${err.message}`, 'ClassSessionsService');
    }
  }

  async findTeacherCalendar(teacherId: string) {
    return this.classSessionModel.find({ teacherId })
      .populate('course', 'title type')
      .populate('recording')
      .sort({ scheduledAt: 1 });
  }

  async findStudentCalendar(studentId: string) {
    const enrollments = await this.enrollmentModel.find({ studentId }, 'courseId');
    const courseIds = enrollments.map((e) => e.courseId);

    return this.classSessionModel.find({ courseId: { $in: courseIds } })
      .populate('course', 'title type')
      .populate('recording')
      .sort({ scheduledAt: 1 });
  }

  async findReviewerCalendar(reviewerId: string) {
    const assignments = await this.reviewerAssignmentModel.find({ reviewerId, isActive: true }, 'courseId');
    const courseIds = assignments.map((a) => a.courseId);

    return this.classSessionModel.find({ courseId: { $in: courseIds } })
      .populate('course', 'title type')
      .populate('recording')
      .sort({ scheduledAt: 1 });
  }

  async logAttendance(
    sessionId: string,
    userId: string,
    joinTime?: Date,
    leaveTime?: Date,
    durationSeconds?: number,
  ) {
    const student = await this.userModel.findById(userId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const session = await this.classSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    return this.attendanceModel.findOneAndUpdate(
      { sessionId, userId },
      {
        $set: {
          joinTime,
          leaveTime,
          ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        },
        $setOnInsert: {
          sessionId,
          userId,
          durationSeconds: durationSeconds ?? 0,
        },
      },
      { upsert: true, new: true },
    );
  }

  async getAttendance(sessionId: string) {
    const session = await this.classSessionModel.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    return this.attendanceModel.find({ sessionId }).populate('user', 'id name email');
  }

  async generateLivekitToken(sessionId: string, user: any) {
    const session = await this.classSessionModel.findById(sessionId).populate({
      path: 'course',
      populate: [
        { path: 'enrollments' },
        { path: 'reviewerAssignments' },
      ],
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    const course: any = session.get ? session.get('course') : (session as any).course;

    let isAuthorized = false;
    let isReviewer = false;

    if (user.role === Role.ADMIN) {
      isAuthorized = true;
      isReviewer = true;
    } else if (user.role === Role.TEACHER) {
      isAuthorized = session.teacherId.toString() === user.id;
    } else if (user.role === Role.STUDENT) {
      const enrollments: any[] = course?.enrollments || [];
      isAuthorized = enrollments.some((e: any) => e.studentId.toString() === user.id);
    } else if (user.role === Role.REVIEWER) {
      const reviewerAssignments: any[] = course?.reviewerAssignments || [];
      isAuthorized = reviewerAssignments.some(
        (a: any) => a.reviewerId.toString() === user.id && a.isActive,
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
    } else if (user.role === Role.STUDENT) {
      grants.canPublish = true;
      grants.canPublishData = true;
      grants.canSubscribe = true;
      grants.hidden = false;
      grants.canPublishSources = [1, 2];
    } else {
      grants.canPublish = true;
      grants.canPublishData = true;
      grants.canSubscribe = true;
      grants.hidden = false;
    }

    token.addGrant(grants);

    if (user.role === Role.TEACHER && session.status !== ClassStatus.COMPLETED && session.status !== ClassStatus.CANCELLED) {
      if (session.status === ClassStatus.SCHEDULED) {
        await this.classSessionModel.findByIdAndUpdate(sessionId, {
          $set: {
            status: ClassStatus.LIVE,
            startedAt: new Date(),
          },
        });
      }
    }

    return {
      token: await token.toJwt(),
      roomName,
      serverUrl: this.configService.get<string>('LIVEKIT_PUBLIC_URL') || this.configService.get<string>('LIVEKIT_HOST'),
    };
  }

  async getStats(user: any) {
    const role = user.role;
    const userId = user.id;

    if (role === Role.ADMIN) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [total, scheduled, live, completed, cancelled, today] = await Promise.all([
        this.classSessionModel.countDocuments(),
        this.classSessionModel.countDocuments({ status: ClassStatus.SCHEDULED }),
        this.classSessionModel.countDocuments({ status: ClassStatus.LIVE }),
        this.classSessionModel.countDocuments({ status: ClassStatus.COMPLETED }),
        this.classSessionModel.countDocuments({ status: ClassStatus.CANCELLED }),
        this.classSessionModel.countDocuments({
          scheduledAt: { $gte: todayStart, $lt: todayEnd },
        }),
      ]);

      const totalTeachers = await this.userModel.countDocuments({ role: Role.TEACHER });
      const totalStudents = await this.userModel.countDocuments({ role: Role.STUDENT });
      const totalCourses = await this.courseModel.countDocuments();

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
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const [total, scheduled, live, completed, cancelled, today, courses] = await Promise.all([
        this.classSessionModel.countDocuments({ teacherId: userId }),
        this.classSessionModel.countDocuments({ teacherId: userId, status: ClassStatus.SCHEDULED }),
        this.classSessionModel.countDocuments({ teacherId: userId, status: ClassStatus.LIVE }),
        this.classSessionModel.countDocuments({ teacherId: userId, status: ClassStatus.COMPLETED }),
        this.classSessionModel.countDocuments({ teacherId: userId, status: ClassStatus.CANCELLED }),
        this.classSessionModel.countDocuments({
          teacherId: userId,
          scheduledAt: { $gte: todayStart, $lt: todayEnd },
        }),
        this.courseModel.find({ teacherId: userId }, 'id'),
      ]);

      const completedSessions = await this.classSessionModel.find(
        { teacherId: userId, status: ClassStatus.COMPLETED },
        'durationMinutes',
      );
      const totalMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      const courseIds = courses.map((c) => c._id);
      const studentCountResult = await this.enrollmentModel.distinct('studentId', { courseId: { $in: courseIds } });

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
      const enrollments = await this.enrollmentModel.find({ studentId: userId }, 'courseId');
      const courseIds = enrollments.map((e) => e.courseId);

      const [total, scheduled, live, completed, cancelled] = await Promise.all([
        this.classSessionModel.countDocuments({ courseId: { $in: courseIds } }),
        this.classSessionModel.countDocuments({ courseId: { $in: courseIds }, status: ClassStatus.SCHEDULED }),
        this.classSessionModel.countDocuments({ courseId: { $in: courseIds }, status: ClassStatus.LIVE }),
        this.classSessionModel.countDocuments({ courseId: { $in: courseIds }, status: ClassStatus.COMPLETED }),
        this.classSessionModel.countDocuments({ courseId: { $in: courseIds }, status: ClassStatus.CANCELLED }),
      ]);

      const completedSessions = await this.classSessionModel.find(
        { courseId: { $in: courseIds }, status: ClassStatus.COMPLETED },
        'durationMinutes',
      );
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
      const assignments = await this.reviewerAssignmentModel.find({ reviewerId: userId, isActive: true }, 'courseId');
      const courseIds = assignments.map((a) => a.courseId);

      // Find sessions completed for these courses that don't have SUBMITTED reviews by reviewer
      const completedSessions = await this.classSessionModel.find({
        courseId: { $in: courseIds },
        status: ClassStatus.COMPLETED,
      }, '_id');

      const completedSessionIds = completedSessions.map((s) => s._id);

      const submittedReviews = await this.classReviewModel.find({
        sessionId: { $in: completedSessionIds },
        status: ReviewStatus.SUBMITTED,
      }, 'sessionId');

      const submittedSessionIds = new Set(submittedReviews.map((r) => r.sessionId.toString()));
      const pendingCount = completedSessionIds.filter((id) => !submittedSessionIds.has(id.toString())).length;

      const [total, flaggedCount, completedReviews] = await Promise.all([
        this.classSessionModel.countDocuments({ courseId: { $in: courseIds } }),
        this.classReviewModel.countDocuments({ reviewerId: userId, isFlagged: true }),
        this.classReviewModel.countDocuments({ reviewerId: userId, status: ReviewStatus.SUBMITTED }),
      ]);

      const reviews = await this.classReviewModel.find({ reviewerId: userId }, 'overallScore');
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

  async getTeacherTimetable(teacherId: string, date: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.classSessionModel.find({
      teacherId,
      scheduledAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    })
      .populate('course', 'title type')
      .populate('student', 'name timezone')
      .sort({ scheduledAt: 1 });
  }

  async getWeeklyScheduleGrid() {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.classSessionModel.find({
      scheduledAt: {
        $gte: startOfWeek,
        $lte: endOfWeek,
      },
    })
      .populate({
        path: 'course',
        populate: { path: 'teacher', select: 'id name' },
      })
      .sort({ scheduledAt: 1 });
  }
}
