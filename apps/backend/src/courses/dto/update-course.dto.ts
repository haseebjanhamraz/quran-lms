import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CourseType } from '@prisma/client';

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(CourseType)
  @IsOptional()
  type?: CourseType;

  @IsString()
  @IsOptional()
  curriculum?: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
