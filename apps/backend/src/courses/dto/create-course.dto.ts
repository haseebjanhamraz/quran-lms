import { IsEnum, IsNotEmpty, IsString, IsMongoId } from 'class-validator';
import { CourseType } from '../../schemas';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(CourseType)
  type: CourseType;

  @IsString()
  @IsNotEmpty()
  curriculum: string;

  @IsMongoId()
  teacherId: string;
}
