import { IsDateString, IsInt, IsNotEmpty, IsMongoId, Min, IsOptional } from 'class-validator';

export class CreateClassSessionDto {
  @IsMongoId()
  courseId: string;

  @IsMongoId()
  @IsOptional()
  teacherId?: string;

  @IsMongoId()
  @IsOptional()
  studentId?: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;
}
