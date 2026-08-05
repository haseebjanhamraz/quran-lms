import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  WeeklyScheduleSlot, WeeklyScheduleSlotDocument, DayOfWeek,
  User, UserDocument, Role,
  Course, CourseDocument,
  ClassSession, ClassSessionDocument, ClassStatus,
  Enrollment, EnrollmentDocument
} from '../schemas';
import { UpsertSlotDto } from './dto/upsert-slot.dto';
import { ScheduleGateway } from './schedule.gateway';

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
    private readonly scheduleGateway: ScheduleGateway,
  ) {}

  async getAvailableTeachers() {
    const teachers = await this.userModel.find({ role: Role.TEACHER, isActive: true }).select('id name email profilePicture timezone');
    const slots = await this.weeklySlotModel.find({ isActive: true });

    const slotCountMap: Record<string, number> = {};
    slots.forEach((s) => {
      const tId = s.teacherId.toString();
      slotCountMap[tId] = (slotCountMap[tId] || 0) + 1;
    });

    return teachers.map((t) => {
      const teacherObj = t.toObject();
      return {
        ...teacherObj,
        assignedDaysCount: slotCountMap[t._id.toString()] || 0,
      };
    });
  }

  async getWeeklyScheduleGrid() {
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

    return rawSlots.map((slotDoc) => {
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

    // Save/update slot in DB
    const updatedSlot = await this.weeklySlotModel.findOneAndUpdate(
      {
        dayOfWeek: dto.dayOfWeek,
        timeSlotIndex: dto.timeSlotIndex,
      },
      {
        $set: {
          dayOfWeek: dto.dayOfWeek,
          timeSlotIndex: dto.timeSlotIndex,
          startTime: dto.startTime,
          endTime: dto.endTime,
          teacherId: dto.teacherId,
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

    // Broadcast update via WebSocket gateway with senderClientId tag
    this.scheduleGateway.broadcastScheduleUpdate('UPSERT_SLOT', slotObj, dto.clientId);

    return slotObj;
  }

  async removeSlot(dayOfWeek: DayOfWeek, timeSlotIndex: number, clientId?: string) {
    const deleted = await this.weeklySlotModel.findOneAndDelete({
      dayOfWeek,
      timeSlotIndex,
    });

    if (deleted) {
      this.scheduleGateway.broadcastScheduleUpdate('REMOVE_SLOT', { dayOfWeek, timeSlotIndex }, clientId);
    }

    return { success: true, removedSlot: deleted };
  }

  async clearAllSlots() {
    await this.weeklySlotModel.deleteMany({});
    this.scheduleGateway.broadcastScheduleUpdate('CLEAR_ALL', {});
    return { success: true };
  }

  // Automatic Weekly Session Generation based on recurring slots
  async generateWeeklySessions(targetDateStr?: string) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    
    // Find Monday of the target week
    const day = targetDate.getDay();
    const diffToMonday = targetDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(targetDate.setDate(diffToMonday));
    monday.setHours(0, 0, 0, 0);

    const dayMap: Record<DayOfWeek, number> = {
      [DayOfWeek.MONDAY]: 0,
      [DayOfWeek.TUESDAY]: 1,
      [DayOfWeek.WEDNESDAY]: 2,
      [DayOfWeek.THURSDAY]: 3,
      [DayOfWeek.FRIDAY]: 4,
      [DayOfWeek.SATURDAY]: 5,
      [DayOfWeek.SUNDAY]: 6,
    };

    const slots = await this.weeklySlotModel.find({ isActive: true, isRecurring: true });
    let createdCount = 0;

    for (const slot of slots) {
      const offset = dayMap[slot.dayOfWeek];
      const slotDate = new Date(monday);
      slotDate.setDate(monday.getDate() + offset);

      // Parse start time "HH:MM"
      const [hours, minutes] = slot.startTime.split(':').map(Number);
      slotDate.setHours(hours, minutes, 0, 0);

      // Calculate duration
      const [endHours, endMinutes] = slot.endTime.split(':').map(Number);
      const startMs = slotDate.getTime();
      const endSlotDate = new Date(slotDate);
      endSlotDate.setHours(endHours, endMinutes, 0, 0);
      const durationMinutes = Math.max(30, Math.round((endSlotDate.getTime() - startMs) / 60000));

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
        });
        createdCount++;
      }
    }

    this.logger.log(`Generated ${createdCount} weekly sessions for week of ${monday.toDateString()}`);
    return { success: true, createdCount, weekOf: monday.toISOString() };
  }
}
