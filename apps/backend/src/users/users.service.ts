import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, Role, Counter, CounterDocument } from '../schemas';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
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
    return obj;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.userModel.findOne({
      email: createUserDto.email.toLowerCase().trim(),
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const { password, dateOfBirth, enrollmentDate, joiningDate, ...rest } = createUserDto;
    const passwordHash = await bcrypt.hash(password, 10);

    const data: any = {
      ...rest,
      email: rest.email.toLowerCase().trim(),
      passwordHash,
    };

    if (dateOfBirth) data.dateOfBirth = new Date(dateOfBirth);
    if (enrollmentDate) data.enrollmentDate = new Date(enrollmentDate);
    if (joiningDate) data.joiningDate = new Date(joiningDate);

    if (rest.role === Role.STUDENT && !data.studentId) {
      data.studentId = await this.getNextStudentId();
    }

    const createdUser = await this.userModel.create(data);
    return this.sanitizeUser(createdUser);
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({
      email: email.toLowerCase().trim(),
    });
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  async findAll() {
    const users = await this.userModel.find().sort({ createdAt: -1 });
    return users.map((u) => this.sanitizeUser(u));
  }

  async findByRole(role: Role) {
    const users = await this.userModel.find({ role }).sort({ createdAt: -1 });
    return users.map((u) => this.sanitizeUser(u));
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, dateOfBirth, enrollmentDate, joiningDate, ...rest } = updateUserDto;
    const data: any = { ...rest };

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (enrollmentDate !== undefined) data.enrollmentDate = enrollmentDate ? new Date(enrollmentDate) : null;
    if (joiningDate !== undefined) data.joiningDate = joiningDate ? new Date(joiningDate) : null;

    const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return this.sanitizeUser(updatedUser);
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, dateOfBirth, ...rest } = dto;
    const data: any = { ...rest };

    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;

    const updatedUser = await this.userModel.findByIdAndUpdate(id, { $set: data }, { new: true });
    return this.sanitizeUser(updatedUser);
  }

  async updateProfilePicture(id: string, filePath: string) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { profilePicture: filePath } },
      { new: true },
    );
    if (!updatedUser) throw new NotFoundException('User not found');
    return this.sanitizeUser(updatedUser);
  }

  async remove(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const deactivatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true },
    );

    return this.sanitizeUser(deactivatedUser);
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
