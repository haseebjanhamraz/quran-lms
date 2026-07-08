import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });
    return setting ? setting.value : defaultValue;
  }

  async setSetting(key: string, value: string, description?: string): Promise<any> {
    this.logger.log(`Setting system config: ${key} = ${value}`);
    return this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, description },
      create: { key, value, description },
    });
  }

  async getAllSettings() {
    return this.prisma.systemSetting.findMany();
  }

  async isAiAnalysisEnabled(): Promise<boolean> {
    const val = await this.getSetting('ai_analysis_enabled', 'false'); // user asked for fallback by default "For now use the fallback and let admin turn off the ai mode" wait, actually they said "let admin and reviewer turn on/off ai mode from the dashboard settings page" and "For now use the fallback". I will default ai mode to false or fallback. Wait, fallback IS the rule-based AI. If AI mode is ON, it uses the fallback. If OFF, it skips AI completely? 
    // "For now use the fallback and let admin turn off the ai mode for analysis in the dashboard settings" -> AI mode ON = use rule-based fallback. AI mode OFF = no analysis.
    // Or AI mode = true (Gemini/Fallback), false (Disabled).
    // Let's use string 'true' / 'false'.
    return val === 'true';
  }
}
