import { Controller, Post, Headers, Body, UseGuards, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LivekitService } from './livekit.service';
import { WebhookReceiver } from 'livekit-server-sdk';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('livekit')
export class LivekitController {
  private receiver: WebhookReceiver;

  constructor(
    private readonly configService: ConfigService,
    private readonly livekitService: LivekitService,
  ) {
    const apiKey = this.configService.get<string>('LIVEKIT_API_KEY') || 'devkey';
    const apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET') || 'secret';
    this.receiver = new WebhookReceiver(apiKey, apiSecret);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('Authorization') authHeader: string,
    @Body() body: any,
  ) {
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    try {
      const event = await this.receiver.receive(JSON.stringify(body), authHeader);
      await this.livekitService.handleWebhookEvent(event);
      return { status: 'success' };
    } catch (err: any) {
      throw new UnauthorizedException(`Webhook signature verification failed: ${err.message}`);
    }
  }

  @Post('mute')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER, Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async muteParticipant(
    @Body() body: { roomName: string; identity: string; trackSid: string; muted: boolean }
  ) {
    await this.livekitService.muteParticipant(body.roomName, body.identity, body.trackSid, body.muted);
    return { status: 'success' };
  }
}
