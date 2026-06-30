import { Module } from '@nestjs/common';
import { LivekitService } from './livekit.service';
import { LivekitController } from './livekit.controller';
import { RecordingsModule } from '../recordings/recordings.module';

@Module({
  imports: [RecordingsModule],
  controllers: [LivekitController],
  providers: [LivekitService],
})
export class LivekitModule {}
