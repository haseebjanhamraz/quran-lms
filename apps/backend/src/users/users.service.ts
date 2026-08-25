import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  User, UserDocument, Role,
  Teacher, TeacherDocument,
  Student, StudentDocument,
  Counter, CounterDocument,
} from '../schemas';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Teacher.name) private readonly teacherModel: Model<TeacherDocument>,
    @InjectModel(Student.name) private readonly studentModel: Model<StudentDocument>,
    @InjectModel(Counter.name) private readonly counterModel: Model<CounterDocument>,
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
      cameraRestricted,
      ...baseUserDto
    } = createUserDto;

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
    } else if (baseUserDto.role === Role.TEACHER) {
      await this.teacherModel.create({
        userId: createdUser._id,
        profile: {
          qualification,
          specialization,
          joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
          salary,
          payType: payType || 'MONTHLY',
          hourlyRate: hourlyRate || 0,
          country: country || 'Pakistan',
          currency: currency || 'PKR',
          employeeId,
          bio,
          phone,
          phoneCode,
          cnicOrId,
          gender,
          dateOfBirth: finalDob ? new Date(finalDob) : undefined,
          canEditProfile: canEditProfile !== undefined ? canEditProfile : true,
          guarantors: guarantors || [],
        },
      });
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
      cameraRestricted,
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
    } else if (user.role === Role.TEACHER) {
      const teacherUpdate: any = {};
      if (qualification !== undefined) teacherUpdate['profile.qualification'] = qualification;
      if (specialization !== undefined) teacherUpdate['profile.specialization'] = specialization;
      if (joiningDate !== undefined) teacherUpdate['profile.joiningDate'] = joiningDate ? new Date(joiningDate) : null;
      if (salary !== undefined) teacherUpdate['profile.salary'] = salary;
      if (payType !== undefined) teacherUpdate['profile.payType'] = payType;
      if (hourlyRate !== undefined) teacherUpdate['profile.hourlyRate'] = hourlyRate;
      if (country !== undefined) teacherUpdate['profile.country'] = country;
      if (currency !== undefined) teacherUpdate['profile.currency'] = currency;
      if (employeeId !== undefined) teacherUpdate['profile.employeeId'] = employeeId;
      if (bio !== undefined) teacherUpdate['profile.bio'] = bio;
      if (phone !== undefined) teacherUpdate['profile.phone'] = phone;
      if (phoneCode !== undefined) teacherUpdate['profile.phoneCode'] = phoneCode;
      if (cnicOrId !== undefined) teacherUpdate['profile.cnicOrId'] = cnicOrId;
      if (gender !== undefined) teacherUpdate['profile.gender'] = gender;
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
}
