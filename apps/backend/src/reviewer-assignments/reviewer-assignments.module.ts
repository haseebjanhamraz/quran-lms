import { Module } from '@nestjs/common';
import { ReviewerAssignmentsService } from './reviewer-assignments.service';
import { ReviewerAssignmentsController } from './reviewer-assignments.controller';

@Module({
  controllers: [ReviewerAssignmentsController],
  providers: [ReviewerAssignmentsService],
  exports: [ReviewerAssignmentsService],
})
export class ReviewerAssignmentsModule {}
