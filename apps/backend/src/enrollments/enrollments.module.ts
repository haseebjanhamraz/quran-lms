import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import {
  Enrollment, EnrollmentSchema,
  User, UserSchema,
  Course, CourseSchema,
  WeeklyScheduleSlot, WeeklyScheduleSlotSchema,
  Student, StudentSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: WeeklyScheduleSlot.name, schema: WeeklyScheduleSlotSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService, MongooseModule],
})
export class EnrollmentsModule {}
