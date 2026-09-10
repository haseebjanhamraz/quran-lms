import { IsNotEmpty, IsString, IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';

export class SubmitClassReportDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['PRESENT', 'ABSENT', 'LATE'])
  attendanceStatus: string;

  // What was taught in class (general topic, lesson, exercises)
  @IsOptional()
  @IsString()
  topicsCovered?: string;

  @IsOptional()
  @IsString()
  surahOrLesson?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  performanceRating?: number;

  @IsOptional()
  @IsString()
  @IsIn(['ATTENTIVE', 'ACTIVE_PARTICIPANT', 'COOPERATIVE', 'DISTRACTED', 'NEEDS_FOCUS', 'TIRED'])
  behavior?: string;

  @IsOptional()
  @IsString()
  studentBehavior?: string;

  @IsOptional()
  @IsString()
  @IsIn(['EXCELLENT', 'GOOD', 'AVERAGE', 'NEEDS_HELP'])
  understandingLevel?: string;

  @IsOptional()
  @IsString()
  homeworkAssignment?: string;

  @IsOptional()
  @IsString()
  teacherNotes?: string;

  // Optional legacy fields for backward compatibility
  @IsOptional()
  @IsString()
  fromAyahOrPage?: string;

  @IsOptional()
  @IsString()
  toAyahOrPage?: string;

  @IsOptional()
  @IsString()
  sabaqiRevision?: string;

  @IsOptional()
  @IsString()
  manzilRevision?: string;

  @IsOptional()
  @IsString()
  tajweedLevel?: string;
}

