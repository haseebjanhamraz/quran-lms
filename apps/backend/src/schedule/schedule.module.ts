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
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeeklyScheduleSlot.name, schema: WeeklyScheduleSlotSchema },
      { name: User.name, schema: UserSchema },
      { name: Course.name, schema: CourseSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService, ScheduleGateway],
  exports: [ScheduleService],
})
export class ScheduleModule {}
