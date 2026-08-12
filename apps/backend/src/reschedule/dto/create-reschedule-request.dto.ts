import { IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateRescheduleRequestDto {
  @IsNotEmpty()
  @IsString()
  sessionId: string;

  @IsNotEmpty()
  @IsDateString()
  requestedTime: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
