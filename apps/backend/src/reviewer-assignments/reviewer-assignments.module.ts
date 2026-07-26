import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewerAssignmentsService } from './reviewer-assignments.service';
import { ReviewerAssignmentsController } from './reviewer-assignments.controller';
import { ReviewerAssignment, ReviewerAssignmentSchema, User, UserSchema, Course, CourseSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReviewerAssignment.name, schema: ReviewerAssignmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
    ]),
  ],
  controllers: [ReviewerAssignmentsController],
  providers: [ReviewerAssignmentsService],
  exports: [ReviewerAssignmentsService, MongooseModule],
})
export class ReviewerAssignmentsModule {}
