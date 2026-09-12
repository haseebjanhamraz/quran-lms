import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NoticeBoardService } from './notice-board.service';
import { NoticeBoardController } from './notice-board.controller';
import { Notice, NoticeSchema, User, UserSchema } from '../schemas';
import { ScheduleModule } from '../schedule/schedule.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notice.name, schema: NoticeSchema },
      { name: User.name, schema: UserSchema },
    ]),
    ScheduleModule,
  ],
  controllers: [NoticeBoardController],
  providers: [NoticeBoardService],
  exports: [NoticeBoardService],
})
export class NoticeBoardModule {}
