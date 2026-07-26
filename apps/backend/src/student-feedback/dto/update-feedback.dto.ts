import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateFeedbackDto {
  @IsString()
  @IsOptional()
  @IsIn(['OPEN', 'IN_REVIEW', 'RESOLVED'])
  status?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
