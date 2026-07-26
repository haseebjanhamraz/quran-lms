import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LivekitService } from './livekit.service';
import { LivekitController } from './livekit.controller';
import { RecordingsModule } from '../recordings/recordings.module';
import {
  ClassSession, ClassSessionSchema,
  Recording, RecordingSchema,
  User, UserSchema,
  Attendance, AttendanceSchema,
  PipelineLog, PipelineLogSchema,
} from '../schemas';

@Module({
  imports: [
    RecordingsModule,
    MongooseModule.forFeature([
      { name: ClassSession.name, schema: ClassSessionSchema },
      { name: Recording.name, schema: RecordingSchema },
      { name: User.name, schema: UserSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: PipelineLog.name, schema: PipelineLogSchema },
    ]),
  ],
  controllers: [LivekitController],
  providers: [LivekitService],
})
export class LivekitModule {}
