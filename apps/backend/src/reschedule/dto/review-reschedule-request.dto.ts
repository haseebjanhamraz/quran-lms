import { IsOptional, IsString } from 'class-validator';

export class ReviewRescheduleRequestDto {
  @IsOptional()
  @IsString()
  adminNote?: string;
}
