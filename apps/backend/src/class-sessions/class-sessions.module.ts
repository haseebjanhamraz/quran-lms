import { Module } from '@nestjs/common';
import { ClassSessionsService } from './class-sessions.service';
import { ClassSessionsController } from './class-sessions.controller';
import { RecordingsModule } from '../recordings/recordings.module';
import { LocalStorageModule } from '../local-storage/local-storage.module';

@Module({
  imports: [RecordingsModule, LocalStorageModule],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService],
  exports: [ClassSessionsService],
})
export class ClassSessionsModule {}
