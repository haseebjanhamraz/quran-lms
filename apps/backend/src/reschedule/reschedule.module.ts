import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RescheduleService } from './reschedule.service';
import { RescheduleController } from './reschedule.controller';
import { ClassSessionsModule } from '../class-sessions/class-sessions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  RescheduleRequest,
  RescheduleRequestSchema,
  ClassSession,
  ClassSessionSchema,
  User,
  UserSchema,
} from '../schemas';

@Module({
  imports: [
    ClassSessionsModule,
    NotificationsModule,
    MongooseModule.forFeature([
      { name: RescheduleRequest.name, schema: RescheduleRequestSchema },
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RescheduleController],
  providers: [RescheduleService],
  exports: [RescheduleService],
})
export class RescheduleModule {}
