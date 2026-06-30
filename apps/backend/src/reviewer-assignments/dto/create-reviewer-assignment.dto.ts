import { IsUUID } from 'class-validator';

export class CreateReviewerAssignmentDto {
  @IsUUID()
  reviewerId: string;

  @IsUUID()
  courseId: string;
}
