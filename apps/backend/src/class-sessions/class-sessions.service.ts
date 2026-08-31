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
  SupervisorAssignment, SupervisorAssignmentDocument,
  ClassReview, ClassReviewDocument, ReviewStatus,
  LeaveRequest, LeaveRequestDocument, LeaveStatus,
  LeaveBalance, LeaveBalanceDocument,
} from '../schemas';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { RecordingsService } from '../recordings/recordings.service';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { RedisCacheService } from '../cache/redis-cache.service';

@Injectable()
export class ClassSessionsService {
  constructor(
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(PipelineLog.name) private readonly pipelineLogModel: Model<PipelineLogDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(SupervisorAssignment.name) private readonly supervisorAssignmentModel: Model<SupervisorAssignmentDocument>,
    @InjectModel(ClassReview.name) private readonly classReviewModel: Model<ClassReviewDocument>,
    @InjectModel(LeaveRequest.name) private readonly leaveRequestModel: Model<LeaveRequestDocument>,
    @InjectModel(LeaveBalance.name) private readonly leaveBalanceModel: Model<LeaveBalanceDocument>,
    private readonly configService: ConfigService,
    private readonly recordingsService: RecordingsService,
    private readonly localStorageService: LocalStorageService,
    private readonly cacheService: RedisCacheService,
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

  async create(createClassSessionDto: CreateClassSessionDto, currentUser?: any) {
    const course = await this.courseModel.findById(createClassSessionDto.courseId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const scheduledDate = new Date(createClassSessionDto.scheduledAt);
    const currentUserId = (currentUser?.id || currentUser?._id)?.toString();

    let teacherId = createClassSessionDto.teacherId;
    if (!teacherId) {
      if (currentUser && currentUser.role === Role.TEACHER && currentUserId) {
        teacherId = currentUserId;
      } else {
        teacherId = course.teacherId?.toString() || course.teacherIds?.[0]?.toString();
      }
    }

    if (!teacherId) {
      throw new ConflictException('No teacher assigned to this course.');
    }

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

    const endedAt = new Date(scheduledDate.getTime() + createClassSessionDto.durationMinutes * 60 * 1000);

    const created = await this.classSessionModel.create({
      courseId: createClassSessionDto.courseId,
      teacherId: teacherId,
      studentId: createClassSessionDto.studentId,
      scheduledAt: scheduledDate,
      durationMinutes: createClassSessionDto.durationMinutes,
      status: ClassStatus.SCHEDULED,
      endedAt,
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
      .populate('student', 'id name email profilePicture')
      .populate('teacher', 'id name email profilePicture')
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
    let actualStartTime = session.actualStartTime;
    let actualEndTime = session.actualEndTime;

    if (
      updateClassSessionDto.status === ClassStatus.LIVE &&
      (session.status === ClassStatus.SCHEDULED || session.status === ClassStatus.ACTIVATED)
    ) {
      startedAt = new Date();
      actualStartTime = new Date();
    }

    if (updateClassSessionDto.status === ClassStatus.COMPLETED && session.status === ClassStatus.LIVE) {
      const updatedAtTime = session.updatedAt ? session.updatedAt.getTime() : Date.now();
      const elapsed = Math.round((Date.now() - updatedAtTime) / 60000);
      newDuration = Math.max(1, elapsed);
      actualEndTime = new Date();

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

    const endedAt = new Date(newScheduledAt.getTime() + newDuration * 60 * 1000);

    return this.classSessionModel.findByIdAndUpdate(
      id,
      {
        $set: {
          scheduledAt: newScheduledAt,
          durationMinutes: newDuration,
          status: updateClassSessionDto.status,
          startedAt,
          actualStartTime,
          actualEndTime,
          endedAt,
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
      .populate('student', 'id name preferredName email timezone studentId profilePicture')
      .populate('attendances')
      .populate('recording')
      .sort({ scheduledAt: 1 });
  }

  async findStudentCalendar(studentId: string) {
    const enrollments = await this.enrollmentModel.find({ studentId }, 'courseId');
    const courseIds = enrollments.map((e) => e.courseId);

    return this.classSessionModel.find({
      $or: [
        { studentId },
        { courseId: { $in: courseIds }, studentId: { $exists: false } },
        { courseId: { $in: courseIds }, studentId: null },
      ],
    })
      .populate('course', 'title type')
      .populate('teacher', 'id name email profilePicture')
      .populate('recording')
      .sort({ scheduledAt: 1 });
  }

  async findSupervisorCalendar(supervisorId: string) {
    const assignments = await this.supervisorAssignmentModel.find({ supervisorId, isActive: true });
    const teacherIds = assignments.map((a) => a.teacherId).filter(Boolean);
    const courseIds = assignments.map((a) => a.courseId).filter(Boolean);

    const query: any = {};
    if (teacherIds.length > 0 && courseIds.length > 0) {
      query.$or = [{ teacherId: { $in: teacherIds } }, { courseId: { $in: courseIds } }];
    } else if (teacherIds.length > 0) {
      query.teacherId = { $in: teacherIds };
    } else if (courseIds.length > 0) {
      query.courseId = { $in: courseIds };
    } else {
      return [];
    }

    return this.classSessionModel.find(query)
      .populate('course', 'title type')
      .populate('teacher', 'id name email profilePicture')
      .populate('student', 'id name preferredName email timezone studentId profilePicture')
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
        { path: 'supervisorAssignments' },
      ],
    });

    if (!session) {
      throw new NotFoundException('Class session not found');
    }

    // Check inactive or finished session status
    if (
      session.status === ClassStatus.EXPIRED ||
      session.status === ClassStatus.FROZEN ||
      session.status === ClassStatus.COMPLETED ||
      session.status === ClassStatus.CANCELLED
    ) {
      throw new ForbiddenException(`This class session is ${session.status.toLowerCase()} and can no longer be joined.`);
    }

    // Check if session has expired past its scheduled finish time + 15m grace period
    const nowMs = Date.now();
    const finishMs = new Date(session.scheduledAt).getTime() + session.durationMinutes * 60 * 1000 + 15 * 60 * 1000;
    if (session.status === ClassStatus.SCHEDULED && nowMs > finishMs) {
      await this.classSessionModel.findByIdAndUpdate(sessionId, {
        $set: { status: ClassStatus.EXPIRED, endedAt: new Date(finishMs) },
      });
      throw new ForbiddenException('This class session has expired and can no longer be joined.');
    }

    // Block early joins: only allow joining at or after the scheduled time (admins/reviewers exempt)
    const isAdminOrSuperAdmin = user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN;
    if (!isAdminOrSuperAdmin && session.status === ClassStatus.SCHEDULED) {
      const startMs = new Date(session.scheduledAt).getTime();
      if (nowMs < startMs) {
        const diffMinutes = Math.ceil((startMs - nowMs) / 60000);
        throw new ForbiddenException(
          `This class has not started yet. It is scheduled to begin in ${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}.`
        );
      }
    }

    const course: any = session.get ? session.get('course') : (session as any).course;

    let isAuthorized = false;
    let isReviewer = false;

    const currentUserId = (user?.id || user?._id || user?.sub)?.toString();
    const sessionTeacherId = (session.teacherId as any)?._id?.toString() || (session.teacherId as any)?.id?.toString() || session.teacherId?.toString();

    if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN) {
      isAuthorized = true;
      isReviewer = true;
    } else if (user.role === Role.TEACHER) {
      const courseTeacherId = (course?.teacherId as any)?._id?.toString() || (course?.teacherId as any)?.id?.toString() || course?.teacherId?.toString();
      const courseTeacherIds = (course?.teacherIds || []).map((t: any) =>
        (t as any)?._id?.toString() || (t as any)?.id?.toString() || t?.toString()
      );

      isAuthorized =
        sessionTeacherId === currentUserId ||
        courseTeacherId === currentUserId ||
        courseTeacherIds.includes(currentUserId);
    } else if (user.role === Role.STUDENT) {
      const enrollments: any[] = course?.enrollments || [];
      const sessionStudentId = (session.studentId as any)?._id?.toString() || (session.studentId as any)?.id?.toString() || session.studentId?.toString();
      isAuthorized =
        sessionStudentId === currentUserId ||
        enrollments.some((e: any) => {
          const sId = (e.studentId as any)?._id?.toString() || (e.studentId as any)?.id?.toString() || e.studentId?.toString();
          return sId === currentUserId;
        });
    } else if (user.role === Role.SUPERVISOR) {
      const supervisorAssignments: any[] = course?.supervisorAssignments || [];
      isAuthorized = supervisorAssignments.some((a: any) => {
        const supId = (a.supervisorId as any)?._id?.toString() || (a.supervisorId as any)?.id?.toString() || a.supervisorId?.toString();
        return supId === currentUserId && a.isActive;
      });
      isReviewer = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenException('You are not authorized to join this class session.');
    }

    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY');
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET');

    const roomName = `room-${sessionId}`;

    const userDoc = await this.userModel.findById(user.id);

    const isCameraRestricted = Boolean(userDoc?.cameraRestricted);

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: isReviewer ? `Observer: ${user.name}` : user.name,
      metadata: JSON.stringify({
        profilePicture: userDoc?.profilePicture || '',
        role: user.role,
        cameraRestricted: isCameraRestricted,
      }),
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
    } else if (isCameraRestricted) {
      // Microphone & screenshare allowed, CAMERA (1) strictly prohibited
      grants.canPublish = true;
      grants.canPublishData = true;
      grants.canSubscribe = true;
      grants.hidden = false;
      grants.canPublishSources = [2, 3, 4];
    } else {
      grants.canPublish = true;
      grants.canPublishData = true;
      grants.canSubscribe = true;
      grants.hidden = false;
      grants.canPublishSources = [1, 2, 3, 4];
    }

    token.addGrant(grants);

    if (user.accountStatus === 'SUSPENDED') {
      throw new ForbiddenException('Your account is currently suspended and you cannot participate in classes.');
    }

    if (user.role === Role.TEACHER && (session.status === ClassStatus.SCHEDULED || session.status === ClassStatus.ACTIVATED)) {
      const now = new Date();
      await this.classSessionModel.findByIdAndUpdate(sessionId, {
        $set: {
          status: ClassStatus.LIVE,
          startedAt: now,
          actualStartTime: now,
        },
      });
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

      const [total, scheduled, live, completed, cancelled, expired, frozen, today] = await Promise.all([
        this.classSessionModel.countDocuments(),
        this.classSessionModel.countDocuments({ status: ClassStatus.SCHEDULED }),
        this.classSessionModel.countDocuments({ status: ClassStatus.LIVE }),
        this.classSessionModel.countDocuments({ status: ClassStatus.COMPLETED }),
        this.classSessionModel.countDocuments({ status: ClassStatus.CANCELLED }),
        this.classSessionModel.countDocuments({ status: ClassStatus.EXPIRED }),
        this.classSessionModel.countDocuments({ status: ClassStatus.FROZEN }),
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
        expired,
        frozen,
        today,
        totalTeachers,
        totalStudents,
        totalCourses,
      };
    }

    if (role === Role.TEACHER) {
      const cacheKey = `stats:teacher:${userId}`;
      const cached = await this.cacheService.get(cacheKey);
      if (cached) return cached;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      const now = new Date();

      const [
        total,
        scheduled,
        live,
        completed,
        cancelled,
        today,
        courses,
        pendingLeaves,
        approvedLeaves,
        leaveBalanceDoc,
        nextClass,
      ] = await Promise.all([
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
        this.leaveRequestModel.countDocuments({ teacherId: userId, status: LeaveStatus.PENDING }),
        this.leaveRequestModel.countDocuments({ teacherId: userId, status: LeaveStatus.APPROVED }),
        this.leaveBalanceModel.findOne({ teacherId: userId, year: now.getFullYear() }),
        this.classSessionModel.findOne({
          teacherId: userId,
          status: { $in: [ClassStatus.SCHEDULED, ClassStatus.LIVE] },
          scheduledAt: { $gte: new Date(now.getTime() - 60 * 60 * 1000) },
        }).populate('course', 'title type').sort({ scheduledAt: 1 }).lean(),
      ]);

      const completedSessions = await this.classSessionModel.find(
        { teacherId: userId, status: ClassStatus.COMPLETED },
        'durationMinutes',
      );
      const totalMinutes = completedSessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      const courseIds = courses.map((c) => c._id);
      const studentCountResult = await this.enrollmentModel.distinct('studentId', { courseId: { $in: courseIds } });

      const allocated = leaveBalanceDoc?.allocated || { sick: 10, casual: 12, annual: 15, other: 5 };
      const used = leaveBalanceDoc?.used || { sick: 0, casual: 0, annual: 0, other: 0 };
      const remainingLeaves = {
        sick: Math.max(0, (allocated.sick || 0) - (used.sick || 0)),
        casual: Math.max(0, (allocated.casual || 0) - (used.casual || 0)),
        annual: Math.max(0, (allocated.annual || 0) - (used.annual || 0)),
        other: Math.max(0, (allocated.other || 0) - (used.other || 0)),
        totalRemaining: Math.max(0,
          ((allocated.sick || 0) + (allocated.casual || 0) + (allocated.annual || 0) + (allocated.other || 0)) -
          ((used.sick || 0) + (used.casual || 0) + (used.annual || 0) + (used.other || 0))
        ),
      };

      const result = {
        total,
        scheduled,
        live,
        completed,
        cancelled,
        today,
        totalHours: Math.round(totalMinutes / 60),
        totalStudents: studentCountResult.length,
        pendingLeaves,
        approvedLeaves,
        remainingLeaves,
        nextClass: nextClass ? {
          id: nextClass._id.toString(),
          title: (nextClass as any).course?.title || 'Quran Session',
          type: (nextClass as any).course?.type || 'NAZIRA',
          scheduledAt: nextClass.scheduledAt,
          durationMinutes: nextClass.durationMinutes,
          status: nextClass.status,
        } : null,
      };

      await this.cacheService.set(cacheKey, result, 30); // 30s cache TTL
      return result;
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

    if (role === Role.SUPERVISOR) {
      const assignments = await this.supervisorAssignmentModel.find({ supervisorId: userId, isActive: true }, 'courseId');
      const courseIds = assignments.map((a) => a.courseId);

      // Find sessions completed for these courses that don't have SUBMITTED reviews by supervisor
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
        this.classReviewModel.countDocuments({ supervisorId: userId, isFlagged: true }),
        this.classReviewModel.countDocuments({ supervisorId: userId, status: ReviewStatus.SUBMITTED }),
      ]);

      const reviews = await this.classReviewModel.find({ supervisorId: userId }, 'overallScore');
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
