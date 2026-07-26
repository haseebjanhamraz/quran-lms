import { Module } from '@nestjs/common';
import { StudentFeedbackService } from './student-feedback.service';
import { StudentFeedbackController } from './student-feedback.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StudentFeedbackController],
  providers: [StudentFeedbackService],
})
export class StudentFeedbackModule {}
