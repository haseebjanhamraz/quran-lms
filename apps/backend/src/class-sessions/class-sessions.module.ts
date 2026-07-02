import { Module } from '@nestjs/common';
import { ClassSessionsService } from './class-sessions.service';
import { ClassSessionsController } from './class-sessions.controller';
import { RecordingsModule } from '../recordings/recordings.module';
import { GoogleDriveModule } from '../google-drive/google-drive.module';

@Module({
  imports: [RecordingsModule, GoogleDriveModule],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService],
  exports: [ClassSessionsService],
})
export class ClassSessionsModule {}
