import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { LeaveType } from '../../schemas';

export class CreateLeaveRequestDto {
  @IsNotEmpty()
  @IsEnum(LeaveType, { message: 'leaveType must be SICK, CASUAL, ANNUAL, or OTHER' })
  leaveType: LeaveType;

  @IsNotEmpty()
  @IsISO8601({}, { message: 'startDate must be a valid ISO-8601 date string' })
  startDate: string;

  @IsNotEmpty()
  @IsISO8601({}, { message: 'endDate must be a valid ISO-8601 date string' })
  endDate: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(5, { message: 'Reason must be at least 5 characters long' })
  reason: string;
}
