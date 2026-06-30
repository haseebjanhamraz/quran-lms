import { IsUUID } from 'class-validator';

export class CreateEnrollmentDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;
}
