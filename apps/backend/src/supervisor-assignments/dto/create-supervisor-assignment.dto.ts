import { IsMongoId } from 'class-validator';

export class CreateSupervisorAssignmentDto {
  @IsMongoId()
  supervisorId: string;

  @IsMongoId()
  courseId: string;
}
