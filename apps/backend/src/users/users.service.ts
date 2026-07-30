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
      guardianName, guardianPhone, guardianEmail,
      qualification, specialization, salary, employeeId, bio, guarantors,
      ...baseUserDto
    } = createUserDto;

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = await this.userModel.create({
      ...baseUserDto,
      email: baseUserDto.email.toLowerCase().trim(),
      passwordHash,
    });

    const finalDob = dateOfBirth || dob;

    if (baseUserDto.role === Role.STUDENT) {
      const studentId = await this.getNextStudentId();
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
          guardianPhone,
          guardianEmail,
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
          employeeId,
          bio,
          guarantors: guarantors || [],
        },
      });
    }

    return this.findById(createdUser._id.toString());
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      email: email.toLowerCase().trim(),
    }).populate('studentProfile').populate('teacherProfile');
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id)
      .populate('studentProfile')
      .populate('teacherProfile');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findAll() {
    const users = await this.userModel.find()
      .populate('studentProfile')
      .populate('teacherProfile')
      .sort({ createdAt: -1 });

    return users.map((u) => this.sanitizeUser(u));
  }

  async findByRole(role: Role) {
    const users = await this.userModel.find({ role })
      .populate('studentProfile')
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
      guardianName, guardianPhone, guardianEmail,
      qualification, specialization, salary, employeeId, bio, guarantors,
      ...baseData
    } = updateUserDto;

    const data: any = { ...baseData };

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
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
      if (guardianPhone !== undefined) studentUpdate['profile.guardianPhone'] = guardianPhone;
      if (guardianEmail !== undefined) studentUpdate['profile.guardianEmail'] = guardianEmail;

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
      if (employeeId !== undefined) teacherUpdate['profile.employeeId'] = employeeId;
      if (bio !== undefined) teacherUpdate['profile.bio'] = bio;
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
