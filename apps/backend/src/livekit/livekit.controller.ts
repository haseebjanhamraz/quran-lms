import { Controller, Post, Headers, Body, RawBody, UseGuards, UnauthorizedException, HttpCode, HttpStatus, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(LivekitController.name);

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
    @RawBody() rawBody: Buffer,
  ) {
    if (!authHeader) {
      this.logger.warn('Webhook received without Authorization header');
      throw new UnauthorizedException('Authorization header is missing');
    }

    try {
      const event = await this.receiver.receive(rawBody.toString('utf8'), authHeader);
      this.logger.log(`Webhook event: ${event.event} for room ${event.room?.name || event.egressInfo?.roomName || 'unknown'}`);
      await this.livekitService.handleWebhookEvent(event);
      return { status: 'success' };
    } catch (err: any) {
      this.logger.error(`Webhook verification failed: ${err.message}`);
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
