import { ConflictException, Injectable, NotFoundException, BadRequestException, Logger, Optional, Inject, forwardRef } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { ScheduleGateway } from '../schedule/schedule.gateway';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
import { parsePKTDateAndTimeToUTC, formatPKTTime } from '../utils/islamabad-time';
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
    @Optional() @Inject(forwardRef(() => ScheduleGateway)) private readonly scheduleGateway?: ScheduleGateway,
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

    if (obj._id) {
      obj.id = obj._id.toString();
    }

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

      const formattedGuarantors = Array.isArray(guarantors)
        ? guarantors.map((g: any) => ({
            name: g?.name || '',
            phone: g?.phone || '',
            email: g?.email || undefined,
            relationship: g?.relationship || 'Father',
            cnicOrId: g?.cnicOrId || g?.cnic || g?.cnicNumber || '',
            address: g?.address || undefined,
          }))
        : [];

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
          guarantors: formattedGuarantors,
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
    if (!id || !Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
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

      const currentStudent = await this.studentModel.findOne({ userId: id }).lean();
      const previousTeacherId = currentStudent?.profile?.assignedTeacher
        ? (currentStudent.profile.assignedTeacher.toString() || (currentStudent.profile.assignedTeacher as any)._id?.toString())
        : undefined;

      if (Object.keys(studentUpdate).length > 0) {
        await this.studentModel.findOneAndUpdate(
          { userId: id },
          { $set: studentUpdate },
          { upsert: true },
        );
      }

      if (assignedTeacher !== undefined || classDays !== undefined || classDuration !== undefined) {
        const teacherToCheck = assignedTeacher !== undefined
          ? (assignedTeacher ? assignedTeacher.toString() : undefined)
          : previousTeacherId;

        const daysToCheck = classDays !== undefined
          ? classDays
          : (currentStudent?.profile?.classDays as Array<{ day: string; time?: string; studentTime?: string; teacherTime?: string }> | undefined);

        const durationToCheck = classDuration !== undefined
          ? Number(classDuration)
          : (currentStudent?.profile?.classDuration || 30);

        if (teacherToCheck && daysToCheck && daysToCheck.length > 0) {
          await this.validateTeacherScheduleConflicts(teacherToCheck, daysToCheck, id);
        }

        await this.syncStudentScheduleAndEnrollments(
          id,
          teacherToCheck,
          daysToCheck,
          durationToCheck,
          previousTeacherId,
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
      if (guarantors !== undefined) {
        teacherUpdate['profile.guarantors'] = Array.isArray(guarantors)
          ? guarantors.map((g: any) => ({
              name: g?.name || '',
              phone: g?.phone || '',
              email: g?.email || undefined,
              relationship: g?.relationship || 'Father',
              cnicOrId: g?.cnicOrId || g?.cnic || g?.cnicNumber || '',
              address: g?.address || undefined,
            }))
          : [];
      }

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
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === Role.TEACHER) {
      await this.teacherModel.deleteMany({ userId: id });
      await this.weeklySlotModel.deleteMany({ teacherId: id });
      await this.classSessionModel.deleteMany({ teacherId: id });
      await this.studentModel.updateMany(
        { 'profile.assignedTeacher': id },
        { $unset: { 'profile.assignedTeacher': '' } },
      );
      await this.courseModel.updateMany(
        { teacherId: id },
        { $unset: { teacherId: '' }, $pull: { teacherIds: id } },
      );
    } else if (user.role === Role.STUDENT) {
      await this.studentModel.deleteMany({ userId: id });
      await this.weeklySlotModel.deleteMany({ studentId: id });
      await this.classSessionModel.deleteMany({ studentId: id });
      await this.enrollmentModel.deleteMany({ studentId: id });
    }

    await this.notificationModel.deleteMany({ userId: id });
    await this.userModel.findByIdAndDelete(id);

    await this.cacheService.delByPattern('schedule:*');
    await this.cacheService.delByPattern('stats:*');
    await this.cacheService.delByPattern('sessions:*');
    this.scheduleGateway?.broadcastScheduleUpdate('hard_delete_user', { userId: id });

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
    previousTeacherId?: string,
  ) {
    try {
      const studentFilter: any[] = [studentUserId];
      if (Types.ObjectId.isValid(studentUserId)) {
        studentFilter.push(new Types.ObjectId(studentUserId));
      }

      // 1. Clean up existing WeeklyScheduleSlots for this student
      await this.weeklySlotModel.deleteMany({
        studentId: { $in: studentFilter },
      });

      // 2. Clean up upcoming SCHEDULED class sessions for this student (keep COMPLETED, LIVE, CANCELLED intact)
      const now = new Date();
      await this.classSessionModel.deleteMany({
        studentId: { $in: studentFilter },
        status: ClassStatus.SCHEDULED,
        scheduledAt: { $gte: now },
      });

      // If no teacher is assigned or no schedule days provided, finalize cleanup & notify
      if (!assignedTeacherId || !Array.isArray(classDays) || classDays.length === 0) {
        await this.cacheService.delByPattern('schedule:*');
        await this.cacheService.delByPattern('stats:*');
        await this.cacheService.delByPattern('sessions:*');
        if (previousTeacherId) {
          await this.cacheService.del(`sessions:calendar:teacher:${previousTeacherId}`);
          await this.cacheService.del(`schedule:grid:teacher:${previousTeacherId}`);
          this.scheduleGateway?.sendToUser(previousTeacherId, 'schedule_update', {
            studentId: studentUserId,
            previousTeacherId,
          });
        }
        this.scheduleGateway?.broadcastScheduleUpdate('sync_schedule', {
          studentId: studentUserId,
          teacherId: assignedTeacherId,
          previousTeacherId,
        });
        return;
      }

      const teacherFilter: any[] = [assignedTeacherId];
      if (Types.ObjectId.isValid(assignedTeacherId)) {
        teacherFilter.push(new Types.ObjectId(assignedTeacherId));
      }

      // 3. Find teacher's courses
      const teacherCourses = await this.courseModel.find({
        $or: [{ teacherId: { $in: teacherFilter } }, { teacherIds: { $in: teacherFilter } }],
      });

      let primaryCourseId: any = teacherCourses.length > 0 ? teacherCourses[0]._id : undefined;
      if (!primaryCourseId) {
        const enroll = await this.enrollmentModel.findOne({ studentId: { $in: studentFilter } }).lean();
        if (enroll) primaryCourseId = enroll.courseId;
      }
      if (!primaryCourseId) {
        const anyCourse = await this.courseModel.findOne().lean();
        if (anyCourse) primaryCourseId = anyCourse._id;
      }

      // 4. Auto-enroll student in teacher's course if not enrolled
      if (primaryCourseId) {
        const existingEnrollment = await this.enrollmentModel.findOne({
          studentId: { $in: studentFilter },
          courseId: primaryCourseId,
        });
        if (!existingEnrollment) {
          await this.enrollmentModel.create({
            studentId: studentUserId,
            courseId: primaryCourseId,
          });
        }
      }

      // 5. Parse helper functions
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
        if (!isPM && !isAM && h >= 1 && h <= 6) h += 12;
        return h * 60 + m;
      };

      const minutesToHHMM = (minutes: number): string => {
        const norm = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
        const h = Math.floor(norm / 60);
        const m = norm % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      const dur = classDuration || 30;

      // 6. Sync WeeklyScheduleSlots for new classDays
      for (const slot of classDays) {
        const fullDay = SHORT_TO_FULL_DAYS[slot.day] || (slot.day as DayOfWeek);
        const teacherTimeStr = slot.teacherTime || slot.time || '16:00';
        const studentTimeStr = slot.studentTime || slot.time || '16:00';
        const teacherMins = parseTimeToMinutes(teacherTimeStr);
        const timeSlotIndex = Math.max(0, Math.min(47, Math.floor((teacherMins - 9 * 60) / 30)));
        const startTime = minutesToHHMM(teacherMins);
        const endTime = minutesToHHMM(teacherMins + dur);

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

      // 7. Generate upcoming ClassSessions for the current week window (0 to 7 days ahead)
      const dayMap: Record<string, number> = {
        Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
        Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6,
      };

      const baseDate = new Date();
      baseDate.setHours(0, 0, 0, 0);

      for (let offset = 0; offset <= 7; offset++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + offset);
        const dayNum = d.getDay();

        const matchingSlot = classDays.find((cd) => dayMap[cd.day] === dayNum);
        if (!matchingSlot) continue;

        const teacherTimeStr = matchingSlot.teacherTime || matchingSlot.time || '16:00';
        const scheduledAt = parsePKTDateAndTimeToUTC(d, teacherTimeStr);
        const sessionEnd = new Date(scheduledAt.getTime() + dur * 60 * 1000);

        if (sessionEnd.getTime() + 2 * 60 * 60 * 1000 > now.getTime()) {
          const windowStart = new Date(scheduledAt.getTime() - 15 * 60 * 1000);
          const windowEnd = new Date(scheduledAt.getTime() + 15 * 60 * 1000);

          const existingSession = await this.classSessionModel.findOne({
            teacherId: { $in: teacherFilter },
            studentId: { $in: studentFilter },
            scheduledAt: { $gte: windowStart, $lte: windowEnd },
          });

          if (!existingSession && primaryCourseId) {
            let status = ClassStatus.SCHEDULED;
            if (scheduledAt <= now && now <= sessionEnd) {
              status = ClassStatus.LIVE;
            }

            await this.classSessionModel.create({
              courseId: primaryCourseId,
              teacherId: assignedTeacherId,
              studentId: studentUserId,
              scheduledAt,
              durationMinutes: dur,
              status,
              timezone: 'Asia/Karachi',
              scheduledTimePKT: formatPKTTime(scheduledAt),
            });
          }
        }
      }

      // 8. Invalidate Redis Caches
      await this.cacheService.delByPattern('schedule:*');
      await this.cacheService.delByPattern('stats:*');
      await this.cacheService.delByPattern('sessions:*');
      if (assignedTeacherId) {
        await this.cacheService.del(`sessions:calendar:teacher:${assignedTeacherId}`);
        await this.cacheService.del(`schedule:grid:teacher:${assignedTeacherId}`);
      }
      if (previousTeacherId && previousTeacherId !== assignedTeacherId) {
        await this.cacheService.del(`sessions:calendar:teacher:${previousTeacherId}`);
        await this.cacheService.del(`schedule:grid:teacher:${previousTeacherId}`);
      }
      await this.cacheService.del(`sessions:calendar:student:${studentUserId}`);
      await this.cacheService.del('schedule:grid:admin');

      // 9. Real-time WebSocket Broadcast
      this.scheduleGateway?.broadcastScheduleUpdate('sync_schedule', {
        studentId: studentUserId,
        teacherId: assignedTeacherId,
        previousTeacherId,
      });

      if (assignedTeacherId) {
        this.scheduleGateway?.sendToUser(assignedTeacherId, 'schedule_update', {
          studentId: studentUserId,
          teacherId: assignedTeacherId,
        });
      }
      if (previousTeacherId && previousTeacherId !== assignedTeacherId) {
        this.scheduleGateway?.sendToUser(previousTeacherId, 'schedule_update', {
          studentId: studentUserId,
          previousTeacherId,
        });
      }
    } catch (err: any) {
      if (err instanceof ConflictException) {
        throw err;
      }
      this.logger.warn(`Non-fatal error during schedule sync for student ${studentUserId}:`, err);
    }
  }

  async findTeacherStudents(teacherId: string) {
    const teacherFilter: any[] = [teacherId];
    if (Types.ObjectId.isValid(teacherId)) {
      teacherFilter.push(new Types.ObjectId(teacherId));
    }

    // 1. Find all student profiles where assignedTeacher matches
    const studentProfiles = await this.studentModel
      .find({
        'profile.assignedTeacher': { $in: teacherFilter },
      })
      .populate({
        path: 'userId',
        model: 'User',
        select: 'id name preferredName profilePicture status',
      })
      .lean();

    // 2. Also find all class sessions with this teacher
    const sessions = await this.classSessionModel
      .find({ teacherId: { $in: teacherFilter } })
      .populate('course', 'title type')
      .populate('student', 'id name preferredName profilePicture status studentId')
      .sort({ scheduledAt: 1 })
      .lean();

    const studentMap = new Map<string, any>();

    for (const sp of studentProfiles) {
      const u = sp.userId as any;
      if (!u) continue;
      const sId = (u.id || u._id).toString();
      studentMap.set(sId, {
        id: sId,
        _id: sId,
        name: u.name,
        preferredName: u.preferredName || u.name,
        profilePicture: u.profilePicture,
        status: u.status,
        studentId: sp.studentId,
        languages: sp.profile?.languages && sp.profile.languages.length > 0 ? sp.profile.languages : ['English'],
        classDays: sp.profile?.classDays || [],
        classDuration: sp.profile?.classDuration || 30,
        classesPerWeek: sp.profile?.classesPerWeek || 0,
        tier: sp.profile?.tier || 'Beginner',
        courseTitle: '',
        todaySession: null,
        nextSession: null,
        totalCompletedSessions: 0,
        totalSessionsCount: 0,
      });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    for (const sess of (sessions as any[])) {
      const s = sess.student;
      if (!s) continue;
      const sId = (s.id || s._id).toString();

      if (!studentMap.has(sId)) {
        const studentDoc = await this.studentModel.findOne({ userId: sId }).lean();
        studentMap.set(sId, {
          id: sId,
          _id: sId,
          name: s.name,
          preferredName: s.preferredName || s.name,
          profilePicture: s.profilePicture,
          status: s.status,
          studentId: s.studentId || studentDoc?.studentId,
          languages: studentDoc?.profile?.languages && studentDoc.profile.languages.length > 0 ? studentDoc.profile.languages : ['English'],
          classDays: studentDoc?.profile?.classDays || [],
          classDuration: sess.durationMinutes || studentDoc?.profile?.classDuration || 30,
          classesPerWeek: studentDoc?.profile?.classesPerWeek || 0,
          tier: studentDoc?.profile?.tier || 'Beginner',
          courseTitle: (sess.course as any)?.title || 'Quran Studies',
          todaySession: null,
          nextSession: null,
          totalCompletedSessions: 0,
          totalSessionsCount: 0,
        });
      }

      const entry = studentMap.get(sId);
      entry.totalSessionsCount += 1;

      if (!entry.courseTitle && sess.course) {
        entry.courseTitle = (sess.course as any).title;
      }

      const sessDate = new Date(sess.scheduledAt);
      const isToday = sessDate >= startOfToday && sessDate <= endOfToday;

      if (sess.status === 'COMPLETED') {
        entry.totalCompletedSessions += 1;
      }

      const sessionObj = {
        id: (sess._id || sess.id).toString(),
        scheduledAt: sess.scheduledAt,
        durationMinutes: sess.durationMinutes,
        status: sess.status,
        livekitRoomId: sess.livekitRoomId,
        courseTitle: (sess.course as any)?.title || entry.courseTitle,
      };

      if (isToday) {
        if (!entry.todaySession || sess.status === 'LIVE' || (entry.todaySession.status !== 'LIVE' && sess.status === 'SCHEDULED')) {
          entry.todaySession = sessionObj;
        }
      }

      if (sessDate >= now && sess.status !== 'COMPLETED' && sess.status !== 'CANCELLED') {
        if (!entry.nextSession || new Date(entry.nextSession.scheduledAt) > sessDate) {
          entry.nextSession = sessionObj;
        }
      }
    }

    return Array.from(studentMap.values());
  }
}
