import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, IsOptional, IsNumber, IsBoolean, IsDateString } from 'class-validator';
import { Role } from '../../schemas';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(Role)
  role: Role;

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
