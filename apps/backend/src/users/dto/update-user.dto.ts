import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength, IsNumber, IsDateString } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  preferredName?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string | Date;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  studentId?: number;

  @IsDateString()
  @IsOptional()
  enrollmentDate?: string | Date;

  @IsString()
  @IsOptional()
  studentStatus?: string;

  @IsString()
  @IsOptional()
  trialStatus?: string;

  @IsBoolean()
  @IsOptional()
  discontinued?: boolean;

  @IsNumber()
  @IsOptional()
  salary?: number;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  qualification?: string;

  @IsString()
  @IsOptional()
  specialization?: string;

  @IsDateString()
  @IsOptional()
  joiningDate?: string | Date;
}
