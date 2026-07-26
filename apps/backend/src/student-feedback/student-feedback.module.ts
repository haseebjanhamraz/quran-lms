import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentFeedbackService } from './student-feedback.service';
import { StudentFeedbackController } from './student-feedback.controller';
import { StudentFeedback, StudentFeedbackSchema, User, UserSchema } from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StudentFeedback.name, schema: StudentFeedbackSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StudentFeedbackController],
  providers: [StudentFeedbackService],
  exports: [StudentFeedbackService, MongooseModule],
})
export class StudentFeedbackModule {}
