import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email.toLowerCase().trim() },
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

    const user = await this.prisma.user.create({ data });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return users.map(({ passwordHash: _, ...user }) => user);
  }

  async findByRole(role: import('@prisma/client').Role) {
    const users = await this.prisma.user.findMany({
      where: { role },
      orderBy: { createdAt: 'desc' },
    });
    return users.map(({ passwordHash: _, ...user }) => user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

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

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  async updateProfile(id: string, dto: import('./dto/update-profile.dto').UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

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

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  async updateProfilePicture(id: string, filePath: string) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { profilePicture: filePath },
    });
    const { passwordHash: _, ...result } = updatedUser;
    return result;
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete/deactivate to preserve database integrity and audit logs
    const deactivatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    const { passwordHash: _, ...result } = deactivatedUser;
    return result;
  }

  async changePassword(id: string, dto: import('./dto/change-password.dto').ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new ConflictException('Incorrect old password');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password updated successfully' };
  }
}
