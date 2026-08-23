import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../schemas';

@Controller('system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get('time-slots')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.SUPERVISOR, Role.TEACHER, Role.STUDENT)
  async getTimeSlots() {
    const slots = await this.settingsService.getTimeSlots();
    return { slots };
  }

  @Put('time-slots')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateTimeSlots(@Body('slots') slots: string[]) {
    const updatedSlots = await this.settingsService.setTimeSlots(slots);
    return { success: true, slots: updatedSlots };
  }

  @Get()
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async getAll() {
    return this.settingsService.getAllSettings();
  }

  @Get(':key')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async getByKey(@Param('key') key: string) {
    const value = await this.settingsService.getSetting(key, 'false');
    return { key, value };
  }

  @Put(':key')
  @Roles(Role.ADMIN, Role.SUPERVISOR)
  async updateSetting(@Param('key') key: string, @Body('value') value: string) {
    return this.settingsService.setSetting(key, value);
  }
}
