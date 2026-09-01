import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSetting, SystemSettingDocument } from '../schemas';
import { RedisCacheService } from '../cache/redis-cache.service';

export const DEFAULT_TIME_SLOTS = [
  '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
  '11:00 - 11:30', '11:30 - 12:00', '12:00 - 12:30', '12:30 - 01:00',
  '01:00 - 01:30', '01:30 - 02:00', '02:00 - 02:30', '02:30 - 03:00'
];

export const SCHEDULE_TIME_SLOTS_KEY = 'schedule_time_slots';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectModel(SystemSetting.name) private readonly systemSettingModel: Model<SystemSettingDocument>,
    private readonly cacheService: RedisCacheService,
  ) {}

  async getSetting(key: string, defaultValue: string): Promise<string> {
    const cacheKey = `system_setting:${key}`;
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const setting = await this.systemSettingModel.findOne({ key });
    const result = setting ? setting.value : defaultValue;
    await this.cacheService.set(cacheKey, result, 300); // 5 min TTL
    return result;
  }

  async setSetting(key: string, value: string, description?: string): Promise<any> {
    this.logger.log(`Setting system config: ${key} = ${value}`);
    const updated = await this.systemSettingModel.findOneAndUpdate(
      { key },
      {
        $set: { value, description },
        $setOnInsert: { key },
      },
      { upsert: true, new: true },
    );
    await this.cacheService.del(`system_setting:${key}`);
    await this.cacheService.del(`system_setting:time_slots:all`);
    return updated;
  }

  async getAllSettings() {
    return this.systemSettingModel.find();
  }

  async isAiAnalysisEnabled(): Promise<boolean> {
    const val = await this.getSetting('ai_analysis_enabled', 'false');
    return val === 'true';
  }

  async getTimeSlots(): Promise<string[]> {
    const cacheKey = `system_setting:time_slots:all`;
    const cached = await this.cacheService.get<string[]>(cacheKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached;
    }

    const rawValue = await this.getSetting(SCHEDULE_TIME_SLOTS_KEY, '');
    if (!rawValue) {
      await this.cacheService.set(cacheKey, DEFAULT_TIME_SLOTS, 300);
      return DEFAULT_TIME_SLOTS;
    }
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const slots = parsed.map((s: any) => String(s).trim()).filter(Boolean);
        await this.cacheService.set(cacheKey, slots, 300);
        return slots;
      }
    } catch (e) {
      this.logger.warn(`Failed to parse time slots from settings: ${e}`);
    }
    await this.cacheService.set(cacheKey, DEFAULT_TIME_SLOTS, 300);
    return DEFAULT_TIME_SLOTS;
  }

  async setTimeSlots(slots: string[]): Promise<string[]> {
    if (!Array.isArray(slots) || slots.length === 0) {
      throw new Error('Time slots must be a non-empty array of time ranges');
    }
    const sanitized = slots.map((s) => String(s).trim()).filter(Boolean);
    if (sanitized.length === 0) {
      throw new Error('At least one valid time slot must be provided');
    }
    await this.setSetting(
      SCHEDULE_TIME_SLOTS_KEY,
      JSON.stringify(sanitized),
      'Configured daily timetable time slots for schedule and class sessions'
    );
    await this.cacheService.del(`system_setting:time_slots:all`);
    return sanitized;
  }

  async getCurrentIslamabadTime() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Karachi',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });

    const parts = formatter.formatToParts(now);
    const map: Record<string, string> = {};
    parts.forEach((p) => { map[p.type] = p.value; });

    return {
      timezone: 'Asia/Karachi',
      city: 'Islamabad',
      currentTime: `${map.hour || '12'}:${map.minute || '00'}:${map.second || '00'} ${map.dayPeriod || 'PM'}`,
      dayOfWeek: map.weekday || 'Monday',
      formattedDate: `${map.weekday}, ${map.month} ${map.day}, ${map.year}`,
      iso: now.toISOString(),
      offset: '+05:00',
    };
  }
}
