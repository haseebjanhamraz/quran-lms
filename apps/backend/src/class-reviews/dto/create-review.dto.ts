import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min, Max } from 'class-validator';
import { ReviewMode, ReviewStatus, FlagSeverity } from '@prisma/client';

export class CreateReviewDto {
  @IsString()
  sessionId: string;

  @IsEnum(ReviewMode)
  reviewMode: ReviewMode;

  @IsNumber()
  @Min(1)
  @Max(5)
  curriculumAdherenceScore: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  teachingQualityScore: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  engagementScore: number;

  @IsString()
  @IsOptional()
  strengths: string = '';

  @IsString()
  @IsOptional()
  improvements: string = '';

  @IsString()
  @IsOptional()
  privateNotes: string = '';

  @IsBoolean()
  @IsOptional()
  isFlagged: boolean = false;

  @IsEnum(FlagSeverity)
  @IsOptional()
  flagSeverity?: FlagSeverity;

  @IsString()
  @IsOptional()
  flagReason?: string;

  @IsEnum(ReviewStatus)
  @IsOptional()
  status: ReviewStatus = ReviewStatus.DRAFT;
}
