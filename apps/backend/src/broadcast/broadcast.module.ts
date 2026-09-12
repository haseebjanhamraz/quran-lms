import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BroadcastService } from './broadcast.service';
import { BroadcastController } from './broadcast.controller';
import { Broadcast, BroadcastSchema, User, UserSchema } from '../schemas';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Broadcast.name, schema: BroadcastSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule,
  ],
  controllers: [BroadcastController],
  providers: [BroadcastService],
  exports: [BroadcastService],
})
export class BroadcastModule {}
