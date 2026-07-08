import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  @Roles('ADMIN', 'REVIEWER')
  async getAll() {
    return this.settingsService.getAllSettings();
  }

  @Get(':key')
  @Roles('ADMIN', 'REVIEWER')
  async getByKey(@Param('key') key: string) {
    const value = await this.settingsService.getSetting(key, 'false');
    return { key, value };
  }

  @Put(':key')
  @Roles('ADMIN', 'REVIEWER')
  async updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.setSetting(key, value);
  }
}
