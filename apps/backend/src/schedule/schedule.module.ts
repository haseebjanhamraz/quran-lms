import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleGateway } from './schedule.gateway';
import {
  WeeklyScheduleSlot, WeeklyScheduleSlotSchema,
  User, UserSchema,
  Course, CourseSchema,
  ClassSession, ClassSessionSchema,
  Enrollment, EnrollmentSchema,
  Student, StudentSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeeklyScheduleSlot.name, schema: WeeklyScheduleSlotSchema },
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleGateway],
  exports: [ScheduleService, ScheduleGateway],
})
export class ScheduleModule {}
