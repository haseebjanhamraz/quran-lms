import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ClassStatus } from '@prisma/client';

export class UpdateClassSessionDto {
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus;
}
