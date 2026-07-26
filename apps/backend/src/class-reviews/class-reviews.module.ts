import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassReviewsService } from './class-reviews.service';
import { ClassReviewsController } from './class-reviews.controller';
import {
  ClassReview, ClassReviewSchema,
  ClassSession, ClassSessionSchema,
  ReviewerAssignment, ReviewerAssignmentSchema,
  User, UserSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ClassReview.name, schema: ClassReviewSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: ReviewerAssignment.name, schema: ReviewerAssignmentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ClassReviewsController],
  providers: [ClassReviewsService],
  exports: [ClassReviewsService, MongooseModule],
})
export class ClassReviewsModule {}
