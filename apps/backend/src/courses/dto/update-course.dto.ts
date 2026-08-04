import { IsEnum, IsOptional, IsString, IsMongoId, IsArray } from 'class-validator';
import { CourseType } from '../../schemas';

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

  @IsMongoId()
  @IsOptional()
  teacherId?: string;

  @IsArray()
  @IsOptional()
  teacherIds?: string[];
}
