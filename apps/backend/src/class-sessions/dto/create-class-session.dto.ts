import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min, IsOptional } from 'class-validator';

export class CreateClassSessionDto {
  @IsUUID()
  courseId: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;

  @IsUUID()
  @IsOptional()
  studentId?: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;
}
