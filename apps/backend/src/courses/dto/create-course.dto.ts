import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { CourseType } from '@prisma/client';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(CourseType)
  type: CourseType;

  @IsString()
  @IsNotEmpty()
  curriculum: string;

  @IsUUID()
  teacherId: string;
}
