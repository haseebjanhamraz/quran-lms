import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { SystemSetting, SystemSettingSchema } from '../schemas';

import { RedisCacheModule } from '../cache/redis-cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SystemSetting.name, schema: SystemSettingSchema },
    ]),
    RedisCacheModule,
  ],
  controllers: [SystemSettingsController],
  providers: [SystemSettingsService],
  exports: [SystemSettingsService, MongooseModule],
})
export class SystemSettingsModule {}
