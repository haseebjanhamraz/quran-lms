import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WeeklyScheduleSlot, WeeklyScheduleSlotDocument, DayOfWeek,
  User, UserDocument, Role,
  Course, CourseDocument,
  ClassSession, ClassSessionDocument, ClassStatus,
  Enrollment, EnrollmentDocument,
  Student, StudentDocument,
} from '../schemas';
import { UpsertSlotDto } from './dto/upsert-slot.dto';
import { ScheduleGateway } from './schedule.gateway';
import { RedisCacheService } from '../cache/redis-cache.service';
import {
  getPKTDateParts,
  getPKTHourAndMinute,
  parsePKTDayAndTimeToDate,
  SHORT_DAY_TO_FULL,
  ISLAMABAD_TIMEZONE,
  timeStringToMinutes,
  minutesToTimeString,
} from '../utils/islamabad-time';

const SHORT_TO_FULL_DAYS: Record<string, DayOfWeek> = {
  Mon: DayOfWeek.MONDAY,
  Tue: DayOfWeek.TUESDAY,
  Wed: DayOfWeek.WEDNESDAY,
  Thu: DayOfWeek.THURSDAY,
  Fri: DayOfWeek.FRIDAY,
  Sat: DayOfWeek.SATURDAY,
  Sun: DayOfWeek.SUNDAY,
  Monday: DayOfWeek.MONDAY,
  Tuesday: DayOfWeek.TUESDAY,
  Wednesday: DayOfWeek.WEDNESDAY,
  Thursday: DayOfWeek.THURSDAY,
  Friday: DayOfWeek.FRIDAY,
  Saturday: DayOfWeek.SATURDAY,
  Sunday: DayOfWeek.SUNDAY,
};

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    @InjectModel(WeeklyScheduleSlot.name)
    private readonly weeklySlotModel: Model<WeeklyScheduleSlotDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Course.name)
    private readonly courseModel: Model<CourseDocument>,
    @InjectModel(ClassSession.name)
    private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(Enrollment.name)
    private readonly enrollmentModel: Model<EnrollmentDocument>,
    @InjectModel(Student.name)
    private readonly studentModel: Model<StudentDocument>,
    private readonly scheduleGateway: ScheduleGateway,
    private readonly cacheService: RedisCacheService,
  ) {}

  async getAvailableTeachers() {
    const cacheKey = 'schedule:teachers:available';
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const teachers = await this.userModel.find({ role: Role.TEACHER, isActive: true }).select('id name email profilePicture timezone');
    const slots = await this.weeklySlotModel.find({ isActive: true });

    const slotCountMap: Record<string, number> = {};
    slots.forEach((s) => {
      const tId = s.teacherId.toString();
      slotCountMap[tId] = (slotCountMap[tId] || 0) + 1;
    });

    const result = teachers.map((t) => {
      const teacherObj = t.toObject();
      return {
        ...teacherObj,
        assignedDaysCount: slotCountMap[t._id.toString()] || 0,
      };
    });

    await this.cacheService.set(cacheKey, result, 120); // 120s cache TTL
    return result;
  }

  async getWeeklyScheduleGrid() {
    const cacheKey = 'schedule:grid:admin';
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const rawSlots = await this.weeklySlotModel.find({ isActive: true })
      .populate('teacher', 'id name email profilePicture')
      .populate('course', 'id title type')
      .populate('student', 'id name email');

    // Pre-fetch courses and enrollments to resolve course & student mapping for teachers
    const courses = await this.courseModel.find().lean();
    const enrollments = await this.enrollmentModel.find().populate('student', 'id name email').lean();

    // Map teacherId -> courseObj
    const teacherCourseMap: Record<string, any> = {};
    courses.forEach((c: any) => {
      const courseIdStr = c._id.toString();
      const courseObj = { id: courseIdStr, _id: courseIdStr, title: c.title, type: c.type };
      if (c.teacherId) {
        teacherCourseMap[c.teacherId.toString()] = courseObj;
      }
      if (Array.isArray(c.teacherIds)) {
        c.teacherIds.forEach((tId: any) => {
          teacherCourseMap[tId.toString()] = courseObj;
        });
      }
    });

    // Map courseId -> enrolled students array
    const courseStudentsMap: Record<string, any[]> = {};
    enrollments.forEach((e: any) => {
      if (e.courseId && e.student) {
        const cIdStr = e.courseId.toString();
        if (!courseStudentsMap[cIdStr]) {
          courseStudentsMap[cIdStr] = [];
        }
        const studentObj = typeof e.student === 'object'
          ? { id: e.student._id?.toString() || e.student.id, name: e.student.name, email: e.student.email }
          : { id: e.student, name: 'Enrolled Student' };
        courseStudentsMap[cIdStr].push(studentObj);
      }
    });

    const result = rawSlots.map((slotDoc) => {
      const slot: any = slotDoc.toObject();
      const tId = slot.teacherId ? slot.teacherId.toString() : (slot.teacher?._id || slot.teacher?.id)?.toString();

      // 1. Resolve course assigned to teacher if missing
      if (!slot.course && tId && teacherCourseMap[tId]) {
        slot.course = teacherCourseMap[tId];
        slot.courseId = teacherCourseMap[tId].id;
      }

      // 2. Resolve student assigned to course if missing
      const courseIdStr = slot.course ? (slot.course._id || slot.course.id || slot.courseId)?.toString() : null;
      const enrolledStudents = courseIdStr ? (courseStudentsMap[courseIdStr] || []) : [];

      if (!slot.student && enrolledStudents.length > 0) {
        const studentIdx = slot.timeSlotIndex % enrolledStudents.length;
        slot.student = enrolledStudents[studentIdx];
        slot.studentId = enrolledStudents[studentIdx].id;
      }

      // Attach all enrolled students for this course if available
      slot.enrolledStudents = enrolledStudents;

      return slot;
    });

    await this.cacheService.set(cacheKey, result, 60); // 60s cache TTL
    return result;
  }

  // Scoped strictly to logged-in teacher (prevents reading other teachers' schedule)
  async getTeacherScheduleGrid(teacherId: string) {
    const cacheKey = `schedule:grid:teacher:${teacherId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    const rawSlots = await this.weeklySlotModel.find({ teacherId, isActive: true })
      .populate('teacher', 'id name email profilePicture')
      .populate('course', 'id title type')
      .populate('student', 'id name email');

    // Fetch courses assigned to this teacher
    const courses = await this.courseModel.find({
      $or: [{ teacherId }, { teacherIds: teacherId }],
    }).lean();

    const courseIds = courses.map((c) => c._id);
    const enrollments = await this.enrollmentModel.find({ courseId: { $in: courseIds } })
      .populate('student', 'id name email')
      .lean();

    const teacherCourseMap: Record<string, any> = {};
    courses.forEach((c: any) => {
      const courseIdStr = c._id.toString();
      const courseObj = { id: courseIdStr, _id: courseIdStr, title: c.title, type: c.type };
      teacherCourseMap[teacherId] = courseObj;
    });

    const courseStudentsMap: Record<string, any[]> = {};
    enrollments.forEach((e: any) => {
      if (e.courseId && e.student) {
        const cIdStr = e.courseId.toString();
        if (!courseStudentsMap[cIdStr]) {
          courseStudentsMap[cIdStr] = [];
        }
        const studentObj = typeof e.student === 'object'
          ? { id: e.student._id?.toString() || e.student.id, name: e.student.name, email: e.student.email }
          : { id: e.student, name: 'Enrolled Student' };
        courseStudentsMap[cIdStr].push(studentObj);
      }
    });

    const result = rawSlots.map((slotDoc) => {
      const slot: any = slotDoc.toObject();

      if (!slot.course && teacherCourseMap[teacherId]) {
        slot.course = teacherCourseMap[teacherId];
        slot.courseId = teacherCourseMap[teacherId].id;
      }

      const courseIdStr = slot.course ? (slot.course._id || slot.course.id || slot.courseId)?.toString() : null;
      const enrolledStudents = courseIdStr ? (courseStudentsMap[courseIdStr] || []) : [];

      if (!slot.student && enrolledStudents.length > 0) {
        const studentIdx = slot.timeSlotIndex % enrolledStudents.length;
        slot.student = enrolledStudents[studentIdx];
        slot.studentId = enrolledStudents[studentIdx].id;
      }

      slot.enrolledStudents = enrolledStudents;
      return slot;
    });

    await this.cacheService.set(cacheKey, result, 60); // 60s cache TTL
    return result;
  }

  // Scoped schedule grid for logged-in student
  async getStudentScheduleGrid(studentId: string) {
    const cacheKey = `schedule:grid:student:${studentId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Fetch enrollments for student
    const enrollments = await this.enrollmentModel.find({ studentId }).lean();
    let enrolledCourseIds = enrollments.map((e: any) => e.courseId?.toString()).filter(Boolean);

    // Fetch student user & profile details
    const [studentUser, studentDoc] = await Promise.all([
      this.userModel.findById(studentId).select('id name email').lean(),
      this.studentModel.findOne({ userId: studentId }).lean(),
    ]);

    const assignedTeacherId = studentDoc?.profile?.assignedTeacher
      ? studentDoc.profile.assignedTeacher.toString()
      : null;

    // If student has an assigned teacher, also resolve teacher's courses
    if (assignedTeacherId) {
      const teacherCourses = await this.courseModel.find({
        $or: [{ teacherId: assignedTeacherId }, { teacherIds: assignedTeacherId }],
      }).lean();
      teacherCourses.forEach((tc) => {
        const tcId = tc._id.toString();
        if (!enrolledCourseIds.includes(tcId)) {
          enrolledCourseIds.push(tcId);
        }
      });
    }

    // Fetch courses the student is enrolled in or assigned to
    const courses = await this.courseModel.find({
      _id: { $in: enrolledCourseIds },
    }).lean();

    const courseMap: Record<string, any> = {};
    courses.forEach((c: any) => {
      const cIdStr = c._id.toString();
      courseMap[cIdStr] = { id: cIdStr, _id: cIdStr, title: c.title, type: c.type };
    });

    const studentObj = studentUser
      ? { id: studentUser._id.toString(), name: studentUser.name, email: studentUser.email }
      : null;

    // 1. Direct and related recurring slots
    const slotOrConditions: any[] = [{ studentId }];
    if (enrolledCourseIds.length > 0) {
      slotOrConditions.push({
        courseId: { $in: enrolledCourseIds },
      });
    }
    if (assignedTeacherId) {
      slotOrConditions.push({
        teacherId: assignedTeacherId,
      });
    }

    const directSlots = await this.weeklySlotModel.find({
      isActive: true,
      $or: slotOrConditions,
    })
      .populate('teacher', 'id name email profilePicture')
      .populate('course', 'id title type')
      .populate('student', 'id name email')
      .lean();

    // 2. Real scheduled class sessions for this student
    const sessionOrConditions: any[] = [{ studentId }];
    if (enrolledCourseIds.length > 0) {
      sessionOrConditions.push({ courseId: { $in: enrolledCourseIds } });
    }

    const studentSessions = await this.classSessionModel.find({
      $or: sessionOrConditions,
      status: { $ne: ClassStatus.CANCELLED },
    })
      .populate('teacher', 'id name email profilePicture')
      .populate('course', 'id title type')
      .populate('student', 'id name email')
      .lean();

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const slotMap: Record<string, any> = {};

    directSlots.forEach((slot: any) => {
      const key = `${slot.dayOfWeek}-${slot.timeSlotIndex}`;
      slotMap[key] = {
        ...slot,
        id: slot._id?.toString() || slot.id,
        course: slot.course || (slot.courseId ? courseMap[slot.courseId.toString()] : null),
        student: slot.student || studentObj,
      };
    });

    studentSessions.forEach((sess: any) => {
      const pktParts = getPKTDateParts(new Date(sess.scheduledAt));
      const dayOfWeek = pktParts.dayOfWeek;
      const hours = pktParts.hours;
      const minutes = pktParts.minutes;

      const totalMinutesFrom9 = (hours - 9) * 60 + minutes;
      let timeSlotIndex = Math.floor(totalMinutesFrom9 / 30);
      if (timeSlotIndex < 0) timeSlotIndex = 0;
      if (timeSlotIndex > 47) timeSlotIndex = 47;

      const key = `${dayOfWeek}-${timeSlotIndex}`;
      const startH = Math.floor((9 * 60 + timeSlotIndex * 30) / 60);
      const startM = (9 * 60 + timeSlotIndex * 30) % 60;
      const endH = Math.floor((9 * 60 + (timeSlotIndex + 1) * 30) / 60);
      const endM = (9 * 60 + (timeSlotIndex + 1) * 30) % 60;

      const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      slotMap[key] = {
        id: sess._id?.toString() || sess.id,
        dayOfWeek,
        timeSlotIndex,
        startTime: sess.scheduledTimePKT || startTime,
        endTime,
        teacherId: sess.teacherId,
        teacher: sess.teacher,
        courseId: sess.courseId,
        course: sess.course || (sess.courseId ? courseMap[sess.courseId.toString()] : null),
        studentId,
        student: studentObj,
        sessionId: sess._id?.toString() || sess.id,
        sessionStatus: sess.status,
      };
    });

    // 3. Synthesize slots from student profile classDays if not yet represented in slotMap
    const classDays = studentDoc?.profile?.classDays || [];
    if (Array.isArray(classDays) && classDays.length > 0 && assignedTeacherId) {
      const teacherUser = await this.userModel.findById(assignedTeacherId).select('id name email profilePicture').lean();
      const defaultCourse = courses[0] || { id: 'default', title: 'Quran Class', type: 'NAZIRA' };

      classDays.forEach((cd: any) => {
        const fullDay = SHORT_TO_FULL_DAYS[cd.day] || cd.day;
        const timeStr = cd.time || '16:00';
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = (isNaN(h) ? 16 : h) * 60 + (isNaN(m) ? 0 : m);
        const timeSlotIndex = Math.max(0, Math.min(47, Math.floor((totalMinutes - 9 * 60) / 30)));
        const key = `${fullDay}-${timeSlotIndex}`;

        if (!slotMap[key]) {
          const duration = studentDoc?.profile?.classDuration || 60;
          const endTotal = totalMinutes + duration;
          const endH = Math.floor(endTotal / 60) % 24;
          const endM = endTotal % 60;
          const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

          slotMap[key] = {
            id: `profile-${fullDay}-${timeSlotIndex}`,
            dayOfWeek: fullDay,
            timeSlotIndex,
            startTime: timeStr,
            endTime,
            teacherId: assignedTeacherId,
            teacher: teacherUser ? { id: teacherUser._id.toString(), name: teacherUser.name, email: teacherUser.email } : undefined,
            courseId: defaultCourse.id || defaultCourse._id,
            course: defaultCourse,
            studentId,
            student: studentObj,
          };
        }
      });
    }

    const result = Object.values(slotMap);
    await this.cacheService.set(cacheKey, result, 60); // 60s cache TTL
    return result;
  }

  async upsertSlot(dto: UpsertSlotDto) {
    const teacher = await this.userModel.findById(dto.teacherId);
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new NotFoundException('Teacher not found');
    }

    // Resolve course assigned to teacher if not supplied
    let courseId = dto.courseId;
    if (!courseId) {
      const teacherCourse = await this.courseModel.findOne({
        $or: [{ teacherId: dto.teacherId }, { teacherIds: dto.teacherId }],
      });
      if (teacherCourse) {
        courseId = teacherCourse._id.toString();
      }
    }

    // Resolve student enrolled in course if not supplied
    let studentId = dto.studentId;
    if (!studentId && courseId) {
      const enrollments = await this.enrollmentModel.find({ courseId }).populate('student');
      if (enrollments.length > 0) {
        const idx = dto.timeSlotIndex % enrollments.length;
        const targetStudent = (enrollments[idx] as any)?.student;
        if (targetStudent) {
          studentId = (targetStudent._id || targetStudent.id).toString();
        }
      }
    }

    // Save/update slot in DB per teacher
    const updatedSlot = await this.weeklySlotModel.findOneAndUpdate(
      {
        dayOfWeek: dto.dayOfWeek,
        timeSlotIndex: dto.timeSlotIndex,
        teacherId: dto.teacherId,
      },
      {
        $set: {
          dayOfWeek: dto.dayOfWeek,
          timeSlotIndex: dto.timeSlotIndex,
          startTime: dto.startTime,
          endTime: dto.endTime,
          teacherId: dto.teacherId,
          durationMinutes: dto.durationMinutes || 30,
          teacherStartTime: dto.teacherStartTime || dto.startTime,
          studentStartTime: dto.studentStartTime || dto.startTime,
          ...(courseId ? { courseId } : {}),
          ...(studentId ? { studentId } : {}),
          isRecurring: true,
          isActive: true,
        },
      },
      { upsert: true, new: true },
    )
      .populate('teacher', 'id name email profilePicture')
      .populate('course', 'id title type')
      .populate('student', 'id name email');

    const slotObj: any = updatedSlot.toObject();

    // Populate course & student if not automatically populated by mongoose
    if (!slotObj.course && courseId) {
      const c = await this.courseModel.findById(courseId).select('id title type');
      if (c) slotObj.course = c.toObject();
    }
    if (!slotObj.student && studentId) {
      const s = await this.userModel.findById(studentId).select('id name email');
      if (s) slotObj.student = s.toObject();
    }

    // Invalidate caches
    await this.cacheService.delByPattern('schedule:*');
    await this.cacheService.delByPattern('sessions:*');

    // Broadcast update via WebSocket gateway with senderClientId tag
    this.scheduleGateway.broadcastScheduleUpdate('UPSERT_SLOT', slotObj, dto.clientId);

    return slotObj;
  }

  async removeSlot(dayOfWeek: DayOfWeek, timeSlotIndex: number, clientId?: string, teacherId?: string) {
    const filter: any = {
      dayOfWeek,
      timeSlotIndex,
    };
    if (teacherId) {
      filter.teacherId = teacherId;
    }

    const deleted = await this.weeklySlotModel.findOneAndDelete(filter);

    if (deleted) {
      // Invalidate caches
      await this.cacheService.delByPattern('schedule:*');
      await this.cacheService.delByPattern('sessions:*');
      this.scheduleGateway.broadcastScheduleUpdate('REMOVE_SLOT', { dayOfWeek, timeSlotIndex, teacherId }, clientId);
    }

    return { success: true, removedSlot: deleted };
  }

  async clearAllSlots() {
    await this.weeklySlotModel.deleteMany({});
    await this.cacheService.delByPattern('schedule:*');
    await this.cacheService.delByPattern('sessions:*');
    this.scheduleGateway.broadcastScheduleUpdate('CLEAR_ALL', {});
    return { success: true };
  }

  // Automatic Weekly Session Generation based on recurring slots
  async generateWeeklySessions(targetDateStr?: string) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();

    const slots = await this.weeklySlotModel.find({ isActive: true, isRecurring: true });
    let createdCount = 0;

    for (const slot of slots) {
      const slotStartTime = slot.startTime || '09:00';
      const slotEndTime = slot.endTime || '09:30';
      const slotDate = parsePKTDayAndTimeToDate(slot.dayOfWeek, slotStartTime, targetDate);

      // Calculate duration
      const startMin = timeStringToMinutes(slotStartTime);
      const endMin = timeStringToMinutes(slotEndTime);
      let durationMinutes = slot.durationMinutes || (endMin > startMin ? endMin - startMin : 30);
      if (durationMinutes <= 0) durationMinutes = 30;

      // Avoid creating duplicates for the exact same teacher & scheduledAt
      const existing = await this.classSessionModel.findOne({
        teacherId: slot.teacherId,
        scheduledAt: slotDate,
      });

      if (!existing && slot.courseId) {
        await this.classSessionModel.create({
          courseId: slot.courseId,
          teacherId: slot.teacherId,
          studentId: slot.studentId,
          scheduledAt: slotDate,
          durationMinutes,
          status: ClassStatus.SCHEDULED,
          timezone: ISLAMABAD_TIMEZONE,
          scheduledTimePKT: slotStartTime,
        });
        createdCount++;
      }
    }

    await this.cacheService.delByPattern('sessions:*');
    this.logger.log(`Generated ${createdCount} weekly sessions for week of ${targetDate.toDateString()} (Islamabad PKT)`);
    return { success: true, createdCount, targetDate: targetDate.toISOString() };
  }
}
