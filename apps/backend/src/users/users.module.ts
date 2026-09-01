import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import {
  User, UserSchema,
  Teacher, TeacherSchema,
  Student, StudentSchema,
  Counter, CounterSchema,
  Notification, NotificationSchema,
  ClassSession, ClassSessionSchema,
  WeeklyScheduleSlot, WeeklyScheduleSlotSchema,
  Course, CourseSchema,
  Enrollment, EnrollmentSchema,
} from '../schemas';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Teacher.name, schema: TeacherSchema },
      { name: Student.name, schema: StudentSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: WeeklyScheduleSlot.name, schema: WeeklyScheduleSlotSchema },
      { name: Course.name, schema: CourseSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
