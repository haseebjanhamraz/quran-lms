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

  @IsDateString()
  @IsOptional()
  dob?: string | Date;

  @IsString()
  @IsOptional()
  guardianName?: string;

  @IsString()
  @IsOptional()
  guardianType?: string;

  @IsString()
  @IsOptional()
  guardianTypeOther?: string;

  @IsString()
  @IsOptional()
  guardianPhone?: string;

  @IsString()
  @IsOptional()
  guardianEmail?: string;

  @IsNumber()
  @IsOptional()
  classDuration?: number;

  @IsNumber()
  @IsOptional()
  classesPerWeek?: number;

  @IsString()
  @IsOptional()
  tier?: string;

  @IsString()
  @IsOptional()
  noteToTeacher?: string;

  @IsBoolean()
  @IsOptional()
  cameraRestricted?: boolean;

  @IsString()
  @IsOptional()
  phoneCode?: string;

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

  @IsString()
  @IsOptional()
  bio?: string;

  @IsOptional()
  guarantors?: any[];

  @IsString()
  @IsOptional()
  payType?: string;

  @IsNumber()
  @IsOptional()
  hourlyRate?: number;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @IsOptional()
  monthlyFee?: number;

  @IsNumber()
  @IsOptional()
  monthlyFeeOverride?: number;

  @IsNumber()
  @IsOptional()
  feeWaiverPercent?: number;

  @IsString()
  @IsOptional()
  customFeeNotes?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  cnicOrId?: string;

  @IsBoolean()
  @IsOptional()
  canEditProfile?: boolean;
}
