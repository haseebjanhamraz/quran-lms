import { IsMongoId } from 'class-validator';

export class CreateReviewerAssignmentDto {
  @IsMongoId()
  reviewerId: string;

  @IsMongoId()
  courseId: string;
}
