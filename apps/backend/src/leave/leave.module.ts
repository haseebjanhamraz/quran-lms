import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';
import {
  LeaveRequest, LeaveRequestSchema,
  LeaveBalance, LeaveBalanceSchema,
  User, UserSchema,
} from '../schemas';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeaveRequest.name, schema: LeaveRequestSchema },
      { name: LeaveBalance.name, schema: LeaveBalanceSchema },
      { name: User.name, schema: UserSchema },
    ]),
    NotificationsModule,
    ScheduleModule,
  ],
  controllers: [LeaveController],
  providers: [LeaveService],
  exports: [LeaveService],
})
export class LeaveModule {}
