import { IsDateString, IsInt, IsOptional, IsMongoId, Min } from 'class-validator';

export class LogAttendanceDto {
  @IsMongoId()
  userId: string;

  @IsDateString()
  @IsOptional()
  joinTime?: string;

  @IsDateString()
  @IsOptional()
  leaveTime?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  durationSeconds?: number;
}
