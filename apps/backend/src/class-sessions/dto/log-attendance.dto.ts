import { IsDateString, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class LogAttendanceDto {
  @IsUUID()
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
