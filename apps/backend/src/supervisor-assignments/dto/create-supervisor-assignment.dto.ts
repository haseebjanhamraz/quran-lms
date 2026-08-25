import { IsMongoId, IsOptional } from 'class-validator';

export class CreateSupervisorAssignmentDto {
  @IsMongoId()
  supervisorId: string;

  @IsOptional()
  @IsMongoId()
  teacherId?: string;

  @IsOptional()
  @IsMongoId()
  courseId?: string;
}
