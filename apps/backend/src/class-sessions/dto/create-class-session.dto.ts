import { IsDateString, IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

export class CreateClassSessionDto {
  @IsUUID()
  courseId: string;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsInt()
  @Min(1)
  durationMinutes: number;
}
