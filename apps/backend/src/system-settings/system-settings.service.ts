import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemSetting, SystemSettingDocument } from '../schemas';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(
    @InjectModel(SystemSetting.name) private readonly systemSettingModel: Model<SystemSettingDocument>,
  ) {}

  async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.systemSettingModel.findOne({ key });
    return setting ? setting.value : defaultValue;
  }

  async setSetting(key: string, value: string, description?: string): Promise<any> {
    this.logger.log(`Setting system config: ${key} = ${value}`);
    return this.systemSettingModel.findOneAndUpdate(
      { key },
      {
        $set: { value, description },
        $setOnInsert: { key },
      },
      { upsert: true, new: true },
    );
  }

  async getAllSettings() {
    return this.systemSettingModel.find();
  }

  async isAiAnalysisEnabled(): Promise<boolean> {
    const val = await this.getSetting('ai_analysis_enabled', 'false');
    return val === 'true';
  }
}
