import { ConflictException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User, UserDocument, Role, AccountStatus,
  Teacher, TeacherDocument,
  Student, StudentDocument,
  Counter, CounterDocument,
  Notification, NotificationDocument, NotificationType,
  ClassSession, ClassSessionDocument, ClassStatus,
  WeeklyScheduleSlot, WeeklyScheduleSlotDocument, DayOfWeek,
  Course, CourseDocument,
  Enrollment, EnrollmentDocument,
} from '../schemas';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RedisCacheService } from '../cache/redis-cache.service';
import * as bcrypt from 'bcrypt';

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
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Teacher.name) private readonly teacherModel: Model<TeacherDocument>,
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
    @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(ClassSession.name) private readonly classSessionModel: Model<ClassSessionDocument>,
    @InjectModel(WeeklyScheduleSlot.name) private readonly weeklySlotModel: Model<WeeklyScheduleSlotDocument>,
    @InjectModel(Course.name) private readonly courseModel: Model<CourseDocument>,
    @InjectModel(Enrollment.name) private readonly enrollmentModel: Model<EnrollmentDocument>,
    private readonly cacheService: RedisCacheService,
    private readonly emailService: EmailService,
  ) {}

  private async getNextStudentId(): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { name: 'studentId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return counter.seq;
  }

  private sanitizeUser(userDoc: any) {
    if (!userDoc) return null;
    const obj = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
    delete obj.passwordHash;
    delete obj.__v;

    // Flatten embedded profile fields for smooth API compatibility
    if (obj.studentProfile) {
      obj.studentId = obj.studentProfile.studentId;
      if (obj.studentProfile.profile) {
        Object.assign(obj, obj.studentProfile.profile);
        if (obj.studentProfile.profile.dateOfBirth) {
          obj.dob = obj.studentProfile.profile.dateOfBirth;
        }
      }
    }
    if (obj.teacherProfile) {
      if (obj.teacherProfile.profile) {
        Object.assign(obj, obj.teacherProfile.profile);
      }
    }

    return obj;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase().trim(),
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const {
      password, dateOfBirth, dob, enrollmentDate, joiningDate,
      gender, studentStatus, trialStatus, discontinued,
      guardianName, guardianType, guardianTypeOther, guardianPhone, guardianEmail,
      classDuration, classesPerWeek, classDays, assignedTeacher, tier, noteToTeacher,
      monthlyFee, monthlyFeeOverride, feeWaiverPercent, customFeeNotes,
      qualification, specialization, salary, payType, hourlyRate, country, currency,
      employeeId, bio, guarantors, phone, phoneCode, cnicOrId, canEditProfile,
      cameraRestricted, languages,
      ...baseUserDto
    } = createUserDto;

    // Strict conflict check: A teacher cannot have multiple classes in the same slot
    if (baseUserDto.role === Role.STUDENT && assignedTeacher && classDays && classDays.length > 0) {
      await this.validateTeacherScheduleConflicts(assignedTeacher.toString(), classDays);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await this.userModel.create({
      ...baseUserDto,
      email: baseUserDto.email.toLowerCase().trim(),
      passwordHash,
      cameraRestricted: Boolean(cameraRestricted),
      country,
    });

    const finalDob = dateOfBirth || dob;

    if (baseUserDto.role === Role.STUDENT) {
      const studentId = await this.getNextStudentId();
      const calculatedClassesPerWeek = classDays && Array.isArray(classDays) && classDays.length > 0
        ? classDays.length
        : (classesPerWeek !== undefined ? Number(classesPerWeek) : 5);

      await this.studentModel.create({
        userId: createdUser._id,
        studentId,
        profile: {
          gender,
          dateOfBirth: finalDob ? new Date(finalDob) : undefined,
          enrollmentDate: enrollmentDate ? new Date(enrollmentDate) : new Date(),
          studentStatus: studentStatus || 'ACTIVE',
          trialStatus: trialStatus || 'ACTIVE',
          discontinued: discontinued || false,
          guardianName,
          guardianType: guardianType || 'Father',
          guardianTypeOther,
          guardianPhone,
          guardianEmail,
          phone,
          phoneCode,
          country,
          languages: languages || [],
          classDuration: classDuration !== undefined ? Number(classDuration) : 60,
          classesPerWeek: calculatedClassesPerWeek,
          classDays: classDays || [],
          assignedTeacher: assignedTeacher || undefined,
          tier: tier || 'Beginner',
          noteToTeacher,
          monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : (monthlyFeeOverride !== undefined ? Number(monthlyFeeOverride) : undefined),
          monthlyFeeOverride: monthlyFeeOverride !== undefined ? Number(monthlyFeeOverride) : undefined,
          currency: currency || 'USD',
          feeWaiverPercent: feeWaiverPercent !== undefined ? Number(feeWaiverPercent) : 0,
          customFeeNotes,
        },
      });

      // Synchronize schedule slots and enrollments if teacher or class days are assigned
      if (assignedTeacher || (classDays && classDays.length > 0)) {
        await this.syncStudentScheduleAndEnrollments(
          createdUser._id.toString(),
          assignedTeacher ? assignedTeacher.toString() : undefined,
          classDays,
          classDuration !== undefined ? Number(classDuration) : 60,
        );
      }

      // Dispatch Student Admission Email via Resend
      this.emailService.sendStudentAdmissionEmail(
        createdUser.email,
        createdUser.name,
        password,
        studentId,
      ).catch((err) => this.logger.warn(`Failed to dispatch student admission email to ${createdUser.email}:`, err));

    } else if (baseUserDto.role === Role.TEACHER) {
      const resolvedSalary = salary !== undefined
        ? salary
        : (createUserDto.salaryProfile?.baseSalary !== undefined
            ? Number(createUserDto.salaryProfile.baseSalary)
            : (createUserDto.salaryProfile?.salary !== undefined ? Number(createUserDto.salaryProfile.salary) : undefined));
      const resolvedPayType = payType || createUserDto.salaryProfile?.payType || 'MONTHLY';
      const resolvedHourlyRate = hourlyRate !== undefined
        ? hourlyRate
        : (createUserDto.salaryProfile?.hourlyRate !== undefined ? Number(createUserDto.salaryProfile.hourlyRate) : 0);
      const resolvedCurrency = currency || createUserDto.salaryProfile?.currency || 'PKR';
      const resolvedCountry = country || createUserDto.salaryProfile?.country || 'Pakistan';

      await this.teacherModel.create({
        userId: createdUser._id,
        profile: {
          qualification,
          specialization,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          salary: resolvedSalary,
          payType: resolvedPayType,
          hourlyRate: resolvedHourlyRate,
          country: resolvedCountry,
          currency: resolvedCurrency,
          employeeId,
          bio,
          phone,
          phoneCode,
          cnicOrId,
          gender,
          languages: languages || [],
          dateOfBirth: finalDob ? new Date(finalDob) : undefined,
          canEditProfile: canEditProfile !== undefined ? canEditProfile : true,
          guarantors: guarantors || [],
        },
      });

      // Dispatch Teacher Admission / Onboarding Email via Resend
      this.emailService.sendTeacherAdmissionEmail(
        createdUser.email,
        createdUser.name,
        password,
        employeeId,
      ).catch((err) => this.logger.warn(`Failed to dispatch teacher admission email to ${createdUser.email}:`, err));
    }

    return this.findById(createdUser._id.toString());
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      email: email.toLowerCase().trim(),
    })
      .populate({
        path: 'studentProfile',
        populate: { path: 'profile.assignedTeacher', model: 'User', select: 'name email role profilePicture' },
      })
      .populate('teacherProfile');
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id)
      .populate({
        path: 'studentProfile',
        populate: { path: 'profile.assignedTeacher', model: 'User', select: 'name email role profilePicture' },
      })
      .populate('teacherProfile');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findAll() {
    const users = await this.userModel.find()
      .populate({
        path: 'studentProfile',
        populate: { path: 'profile.assignedTeacher', model: 'User', select: 'name email role profilePicture' },
      })
      .populate('teacherProfile')
      .sort({ createdAt: -1 });

    return users.map((u) => this.sanitizeUser(u));
  }

  async findByRole(role: Role) {
    const users = await this.userModel.find({ role })
      .populate({
        path: 'studentProfile',
        populate: { path: 'profile.assignedTeacher', model: 'User', select: 'name email role profilePicture' },
      })
      .populate('teacherProfile')
      .sort({ createdAt: -1 });

    return users.map((u) => this.sanitizeUser(u));
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      password, dateOfBirth, dob, enrollmentDate, joiningDate,
      gender, studentStatus, trialStatus, discontinued,
      guardianName, guardianType, guardianTypeOther, guardianPhone, guardianEmail,
      classDuration, classesPerWeek, classDays, assignedTeacher, tier, noteToTeacher,
      monthlyFee, monthlyFeeOverride, feeWaiverPercent, customFeeNotes,
      qualification, specialization, salary, payType, hourlyRate, country, currency,
      employeeId, bio, guarantors, phone, phoneCode, cnicOrId, canEditProfile,
      cameraRestricted, languages,
      ...baseData
    } = updateUserDto;

    const data: any = { ...baseData };

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (cameraRestricted !== undefined) {
      data.cameraRestricted = Boolean(cameraRestricted);
    }

    if (country !== undefined) {
      data.country = country;
    }

    await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true });

    if (user.role === Role.STUDENT) {
      const studentUpdate: any = {};
      if (gender !== undefined) studentUpdate['profile.gender'] = gender;
      const finalDob = dateOfBirth !== undefined ? dateOfBirth : dob;
      if (finalDob !== undefined) studentUpdate['profile.dateOfBirth'] = finalDob ? new Date(finalDob) : null;
      if (enrollmentDate !== undefined) studentUpdate['profile.enrollmentDate'] = enrollmentDate ? new Date(enrollmentDate) : null;
      if (studentStatus !== undefined) studentUpdate['profile.studentStatus'] = studentStatus;
      if (trialStatus !== undefined) studentUpdate['profile.trialStatus'] = trialStatus;
      if (discontinued !== undefined) studentUpdate['profile.discontinued'] = discontinued;
      if (guardianName !== undefined) studentUpdate['profile.guardianName'] = guardianName;
      if (guardianType !== undefined) studentUpdate['profile.guardianType'] = guardianType;
      if (guardianTypeOther !== undefined) studentUpdate['profile.guardianTypeOther'] = guardianTypeOther;
      if (guardianPhone !== undefined) studentUpdate['profile.guardianPhone'] = guardianPhone;
      if (guardianEmail !== undefined) studentUpdate['profile.guardianEmail'] = guardianEmail;
      if (phone !== undefined) studentUpdate['profile.phone'] = phone;
      if (phoneCode !== undefined) studentUpdate['profile.phoneCode'] = phoneCode;
      if (country !== undefined) studentUpdate['profile.country'] = country;
      if (languages !== undefined) studentUpdate['profile.languages'] = languages;
      if (classDuration !== undefined) studentUpdate['profile.classDuration'] = Number(classDuration);
      if (classDays !== undefined) {
        studentUpdate['profile.classDays'] = classDays;
        studentUpdate['profile.classesPerWeek'] = Array.isArray(classDays) ? classDays.length : (classesPerWeek ? Number(classesPerWeek) : 0);
      } else if (classesPerWeek !== undefined) {
        studentUpdate['profile.classesPerWeek'] = Number(classesPerWeek);
      }
      if (assignedTeacher !== undefined) {
        studentUpdate['profile.assignedTeacher'] = assignedTeacher || null;
      }
      if (tier !== undefined) studentUpdate['profile.tier'] = tier;
      if (noteToTeacher !== undefined) studentUpdate['profile.noteToTeacher'] = noteToTeacher;
      if (monthlyFee !== undefined) studentUpdate['profile.monthlyFee'] = Number(monthlyFee);
      if (monthlyFeeOverride !== undefined) studentUpdate['profile.monthlyFeeOverride'] = Number(monthlyFeeOverride);
      if (feeWaiverPercent !== undefined) studentUpdate['profile.feeWaiverPercent'] = Number(feeWaiverPercent);
      if (customFeeNotes !== undefined) studentUpdate['profile.customFeeNotes'] = customFeeNotes;
      if (currency !== undefined) studentUpdate['profile.currency'] = currency;

      if (Object.keys(studentUpdate).length > 0) {
        await this.studentModel.findOneAndUpdate(
          { userId: id },
          { $set: studentUpdate },
          { upsert: true },
        );
      }

      if (assignedTeacher || (classDays && classDays.length > 0)) {
        let teacherToCheck = assignedTeacher ? assignedTeacher.toString() : undefined;
        let daysToCheck: Array<{ day: string; time?: string; studentTime?: string; teacherTime?: string }> | undefined = classDays;
        if (!teacherToCheck || !daysToCheck) {
          const currentStudent = await this.studentModel.findOne({ userId: id }).lean();
          if (!teacherToCheck) teacherToCheck = currentStudent?.profile?.assignedTeacher?.toString();
          if (!daysToCheck) daysToCheck = currentStudent?.profile?.classDays;
        }

        if (teacherToCheck && daysToCheck && daysToCheck.length > 0) {
          await this.validateTeacherScheduleConflicts(teacherToCheck, daysToCheck, id);
        }

        await this.syncStudentScheduleAndEnrollments(
          id,
          assignedTeacher ? assignedTeacher.toString() : undefined,
          classDays,
          classDuration !== undefined ? Number(classDuration) : undefined,
        );
      }
    } else if (user.role === Role.TEACHER) {
      const teacherUpdate: any = {};
      if (qualification !== undefined) teacherUpdate['profile.qualification'] = qualification;
      if (specialization !== undefined) teacherUpdate['profile.specialization'] = specialization;
      if (joiningDate !== undefined) teacherUpdate['profile.joiningDate'] = joiningDate ? new Date(joiningDate) : null;
      const resolvedSalary = salary !== undefined
        ? salary
        : (updateUserDto.salaryProfile?.baseSalary !== undefined
            ? Number(updateUserDto.salaryProfile.baseSalary)
            : (updateUserDto.salaryProfile?.salary !== undefined ? Number(updateUserDto.salaryProfile.salary) : undefined));
      const resolvedPayType = payType !== undefined ? payType : updateUserDto.salaryProfile?.payType;
      const resolvedHourlyRate = hourlyRate !== undefined
        ? hourlyRate
        : (updateUserDto.salaryProfile?.hourlyRate !== undefined ? Number(updateUserDto.salaryProfile.hourlyRate) : undefined);
      const resolvedCurrency = currency !== undefined ? currency : updateUserDto.salaryProfile?.currency;
      const resolvedCountry = country !== undefined ? country : updateUserDto.salaryProfile?.country;

      if (resolvedSalary !== undefined) teacherUpdate['profile.salary'] = resolvedSalary;
      if (resolvedPayType !== undefined) teacherUpdate['profile.payType'] = resolvedPayType;
      if (resolvedHourlyRate !== undefined) teacherUpdate['profile.hourlyRate'] = resolvedHourlyRate;
      if (resolvedCountry !== undefined) teacherUpdate['profile.country'] = resolvedCountry;
      if (resolvedCurrency !== undefined) teacherUpdate['profile.currency'] = resolvedCurrency;
      if (employeeId !== undefined) teacherUpdate['profile.employeeId'] = employeeId;
      if (bio !== undefined) teacherUpdate['profile.bio'] = bio;
      if (phone !== undefined) teacherUpdate['profile.phone'] = phone;
      if (phoneCode !== undefined) teacherUpdate['profile.phoneCode'] = phoneCode;
      if (cnicOrId !== undefined) teacherUpdate['profile.cnicOrId'] = cnicOrId;
      if (gender !== undefined) teacherUpdate['profile.gender'] = gender;
      if (languages !== undefined) teacherUpdate['profile.languages'] = languages;
      const finalDob = dateOfBirth !== undefined ? dateOfBirth : dob;
      if (finalDob !== undefined) teacherUpdate['profile.dateOfBirth'] = finalDob ? new Date(finalDob) : null;
      if (canEditProfile !== undefined) teacherUpdate['profile.canEditProfile'] = canEditProfile;
      if (guarantors !== undefined) teacherUpdate['profile.guarantors'] = guarantors;

      if (Object.keys(teacherUpdate).length > 0) {
        await this.teacherModel.findOneAndUpdate(
          { userId: id },
          { $set: teacherUpdate },
          { upsert: true },
        );
      }
    }

    return this.findById(id);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.TEACHER) {
      const teacher = await this.teacherModel.findOne({ userId: id });
      if (teacher && teacher.profile && teacher.profile.canEditProfile === false) {
        throw new ConflictException('Admin has restricted profile updates for your account.');
      }
    }

    const { password, dateOfBirth, gender, ...baseData } = dto as any;
    const data: any = { ...baseData };

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true });

    if (user.role === Role.STUDENT && (gender !== undefined || dateOfBirth !== undefined)) {
      const studentUpdate: any = {};
      if (gender !== undefined) studentUpdate['profile.gender'] = gender;
      if (dateOfBirth !== undefined) studentUpdate['profile.dateOfBirth'] = dateOfBirth ? new Date(dateOfBirth) : null;

      await this.studentModel.findOneAndUpdate(
        { userId: id },
        { $set: studentUpdate },
        { upsert: true },
      );
    }

    return this.findById(id);
  }

  async updateProfilePicture(id: string, filePath: string) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { profilePicture: filePath } },
      { new: true },
    );
    if (!updatedUser) throw new NotFoundException('User not found');
    return this.findById(id);
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    );

    return this.findById(id);
  }

  async changePassword(id: string, dto: ChangePasswordDto) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new ConflictException('Incorrect old password');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userModel.findByIdAndUpdate(id, { $set: { passwordHash: newPasswordHash } });

    return { message: 'Password updated successfully' };
  }

  async updateAccountStatus(id: string, accountStatus: AccountStatus, reason?: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isActive = accountStatus === AccountStatus.ACTIVE;
    const now = new Date();

    await this.userModel.findByIdAndUpdate(
      id,
      {
        $set: {
          accountStatus,
          accountStatusReason: reason || '',
          statusUpdatedAt: now,
          isActive,
        },
      },
      { new: true },
    );

    // If suspended or terminated, cancel upcoming scheduled sessions
    if (accountStatus === AccountStatus.SUSPENDED || accountStatus === AccountStatus.TERMINATED) {
      if (user.role === Role.TEACHER) {
        await this.classSessionModel.updateMany(
          { teacherId: id, status: { $in: [ClassStatus.SCHEDULED, ClassStatus.ACTIVATED] } },
          { $set: { status: ClassStatus.CANCELLED } },
        );
      } else if (user.role === Role.STUDENT) {
        await this.classSessionModel.updateMany(
          { studentId: id, status: { $in: [ClassStatus.SCHEDULED, ClassStatus.ACTIVATED] } },
          { $set: { status: ClassStatus.CANCELLED } },
        );
      }
    }

    // Create a notification for the user
    try {
      await this.notificationModel.create({
        userId: id,
        title: `Account Status Updated: ${accountStatus}`,
        message: reason
          ? `Your account status has been changed to ${accountStatus}. Reason: ${reason}`
          : `Your account status has been changed to ${accountStatus}.`,
        type: NotificationType.SYSTEM,
        isRead: false,
      });
    } catch (_) {}

    return this.findById(id);
  }

  async submitAppeal(userId: string, data: { subject?: string; reason: string }) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find admin users to notify
    const admins = await this.userModel.find({ role: { $in: [Role.ADMIN, Role.SUPER_ADMIN] } });
    for (const admin of admins) {
      try {
        await this.notificationModel.create({
          userId: admin._id,
          title: `Account Appeal: ${user.name}`,
          message: `Subject: ${data.subject || 'Termination Appeal'}\nReason: ${data.reason}`,
          type: NotificationType.SYSTEM,
          isRead: false,
          metadata: {
            appealingUserId: user._id,
            appealingUserName: user.name,
            appealingUserEmail: user.email,
            subject: data.subject,
            reason: data.reason,
          },
        });
      } catch (_) {}
    }

    return {
      success: true,
      message: 'Your appeal has been submitted successfully to administration.',
    };
  }

  async hardDelete(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.TEACHER) {
      await this.teacherModel.deleteMany({ userId: id });
    } else if (user.role === Role.STUDENT) {
      await this.studentModel.deleteMany({ userId: id });
    }

    await this.userModel.findByIdAndDelete(id);

    return { success: true, message: 'User account permanently deleted' };
  }

  private async validateTeacherScheduleConflicts(
    teacherId?: string,
    classDays?: Array<{ day: string; time?: string; studentTime?: string; teacherTime?: string }>,
    studentUserId?: string,
  ) {
    if (!teacherId || !Array.isArray(classDays) || classDays.length === 0) return;

    for (const slot of classDays) {
      const fullDay = SHORT_TO_FULL_DAYS[slot.day] || (slot.day as DayOfWeek);
      const teacherTimeStr = slot.teacherTime || slot.time || '16:00';
      const parseTimeToMinutes = (tStr?: string): number => {
        if (!tStr) return 16 * 60;
        const trimmed = tStr.trim().toUpperCase();
        const isPM = trimmed.includes('PM');
        const isAM = trimmed.includes('AM');
        const clean = trimmed.replace(/[A-Z]/g, '').trim();
        const [hStr, mStr] = clean.split(':');
        let h = parseInt(hStr, 10) || 0;
        const m = parseInt(mStr, 10) || 0;
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h * 60 + m;
      };
      const teacherMins = parseTimeToMinutes(teacherTimeStr);
      const timeSlotIndex = Math.max(0, Math.min(47, Math.floor((teacherMins - 9 * 60) / 30)));

      const existingSlot = await this.weeklySlotModel.findOne({
        dayOfWeek: fullDay,
        timeSlotIndex,
        teacherId,
        isActive: true,
      });

      if (
        existingSlot &&
        existingSlot.studentId &&
        (!studentUserId || existingSlot.studentId.toString() !== studentUserId.toString())
      ) {
        throw new ConflictException(
          `Schedule conflict: The selected teacher already has another class assigned on ${fullDay} at ${teacherTimeStr}. A teacher can only have one class at a time. Please choose an open time slot.`
        );
      }
    }
  }

  private async syncStudentScheduleAndEnrollments(
    studentUserId: string,
    assignedTeacherId?: string,
    classDays?: Array<{ day: string; time?: string; studentTime?: string; teacherTime?: string }>,
    classDuration?: number,
  ) {
    if (!assignedTeacherId) return;

    try {
      // 1. Find teacher's courses
      const teacherCourses = await this.courseModel.find({
        $or: [{ teacherId: assignedTeacherId }, { teacherIds: assignedTeacherId }],
      });

      // 2. Auto-enroll student in teacher's primary course if not enrolled
      if (teacherCourses.length > 0) {
        const primaryCourse = teacherCourses[0];
        const existingEnrollment = await this.enrollmentModel.findOne({
          studentId: studentUserId,
          courseId: primaryCourse._id,
        });
        if (!existingEnrollment) {
          await this.enrollmentModel.create({
            studentId: studentUserId,
            courseId: primaryCourse._id,
          });
        }
      }

      // 3. Sync WeeklyScheduleSlots for classDays
      if (Array.isArray(classDays) && classDays.length > 0) {
        const primaryCourseId = teacherCourses.length > 0 ? teacherCourses[0]._id : undefined;

        for (const slot of classDays) {
          const fullDay = SHORT_TO_FULL_DAYS[slot.day] || (slot.day as DayOfWeek);
          
          const parseTimeToMinutes = (tStr?: string): number => {
            if (!tStr) return 16 * 60;
            const trimmed = tStr.trim().toUpperCase();
            const isPM = trimmed.includes('PM');
            const isAM = trimmed.includes('AM');
            const clean = trimmed.replace(/[A-Z]/g, '').trim();
            const [hStr, mStr] = clean.split(':');
            let h = parseInt(hStr, 10) || 0;
            const m = parseInt(mStr, 10) || 0;
            if (isPM && h < 12) h += 12;
            if (isAM && h === 12) h = 0;
            return h * 60 + m;
          };

          const minutesToHHMM = (minutes: number): string => {
            const norm = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
            const h = Math.floor(norm / 60);
            const m = norm % 60;
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
          };

          const teacherTimeStr = slot.teacherTime || slot.time || '16:00';
          const studentTimeStr = slot.studentTime || slot.time || '16:00';
          const teacherMins = parseTimeToMinutes(teacherTimeStr);
          const dur = classDuration || 30;
          const timeSlotIndex = Math.max(0, Math.min(47, Math.floor((teacherMins - 9 * 60) / 30)));
          const startTime = minutesToHHMM(teacherMins);
          const endTime = minutesToHHMM(teacherMins + dur);

          const existingSlot = await this.weeklySlotModel.findOne({
            dayOfWeek: fullDay,
            timeSlotIndex,
            teacherId: assignedTeacherId,
            isActive: true,
          });

          if (
            existingSlot &&
            existingSlot.studentId &&
            existingSlot.studentId.toString() !== studentUserId.toString()
          ) {
            throw new ConflictException(
              `Schedule conflict: The teacher already has a class assigned on ${fullDay} at ${teacherTimeStr}. A teacher can only have one class at a time.`
            );
          }

          await this.weeklySlotModel.findOneAndUpdate(
            {
              dayOfWeek: fullDay,
              timeSlotIndex,
              teacherId: assignedTeacherId,
            },
            {
              $set: {
                dayOfWeek: fullDay,
                timeSlotIndex,
                startTime,
                endTime,
                durationMinutes: dur,
                teacherStartTime: slot.teacherTime || teacherTimeStr,
                studentStartTime: slot.studentTime || studentTimeStr,
                teacherId: assignedTeacherId,
                studentId: studentUserId,
                ...(primaryCourseId ? { courseId: primaryCourseId } : {}),
                isRecurring: true,
                isActive: true,
              },
            },
            { upsert: true, new: true },
          );
        }
      }

      await this.cacheService.delByPattern('schedule:*');
      await this.cacheService.delByPattern('stats:*');
    } catch (err: any) {
      if (err instanceof ConflictException) {
        throw err;
      }
      this.logger.warn(`Non-fatal error during schedule sync for student ${studentUserId}:`, err);
    }
  }
}
