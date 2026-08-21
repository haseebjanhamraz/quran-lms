import { IsOptional, IsString } from 'class-validator';

export class ReviewLeaveRequestDto {
  @IsOptional()
  @IsString()
  adminRemarks?: string;
}
