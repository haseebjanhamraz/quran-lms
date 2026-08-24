import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClassSessionsService } from './class-sessions.service';
import { ClassSessionsController } from './class-sessions.controller';
import { RecordingsModule } from '../recordings/recordings.module';
import { LocalStorageModule } from '../local-storage/local-storage.module';
import {
  ClassSession, ClassSessionSchema,
  Course, CourseSchema,
  User, UserSchema,
  Attendance, AttendanceSchema,
  PipelineLog, PipelineLogSchema,
  Enrollment, EnrollmentSchema,
  SupervisorAssignment, SupervisorAssignmentSchema,
  ClassReview, ClassReviewSchema,
  LeaveRequest, LeaveRequestSchema,
  LeaveBalance, LeaveBalanceSchema,
} from '../schemas';

import { ClassExpiryService } from './class-expiry.service';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    RecordingsModule,
    LocalStorageModule,
    PermissionsModule,
    MongooseModule.forFeature([
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: Course.name, schema: CourseSchema },
      { name: User.name, schema: UserSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: PipelineLog.name, schema: PipelineLogSchema },
      { name: Enrollment.name, schema: EnrollmentSchema },
      { name: SupervisorAssignment.name, schema: SupervisorAssignmentSchema },
      { name: ClassReview.name, schema: ClassReviewSchema },
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeaveBalance.name, schema: LeaveBalanceSchema },
    ]),
  ],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService, ClassExpiryService],
  exports: [ClassSessionsService, ClassExpiryService, MongooseModule],
})
export class ClassSessionsModule {}
