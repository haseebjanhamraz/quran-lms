import { IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { DayOfWeek } from '../../schemas/weekly-schedule-slot.schema';

export class UpsertSlotDto {
  @IsEnum(DayOfWeek)
  @IsNotEmpty()
  dayOfWeek: DayOfWeek;

  @IsInt()
  @Min(0)
  @Max(100)
  timeSlotIndex: number;

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsMongoId()
  @IsNotEmpty()
  teacherId: string;

  @IsMongoId()
  @IsOptional()
  courseId?: string;

  @IsMongoId()
  @IsOptional()
  studentId?: string;

  @IsString()
  @IsOptional()
  clientId?: string;

  @IsInt()
  @IsOptional()
  durationMinutes?: number;

  @IsString()
  @IsOptional()
  teacherStartTime?: string;

  @IsString()
  @IsOptional()
  studentStartTime?: string;
}
