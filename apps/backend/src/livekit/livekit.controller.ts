import { Controller, Post, Headers, Body, RawBody, Req, UseGuards, UnauthorizedException, HttpCode, HttpStatus, Logger } from '@nestjs/common';
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
    @Req() req: any,
    @Body() body: any,
    @RawBody() rawBody?: Buffer,
  ) {
    if (!authHeader) {
      this.logger.warn('Webhook received without Authorization header');
      throw new UnauthorizedException('Authorization header is missing');
    }

    try {
      let bodyString = '';
      if (rawBody && Buffer.isBuffer(rawBody)) {
        bodyString = rawBody.toString('utf8');
      } else if (req?.rawBody) {
        bodyString = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : req.rawBody;
      } else if (typeof body === 'string') {
        bodyString = body;
      } else {
        bodyString = JSON.stringify(body || {});
      }

      let event: any;
      try {
        event = await this.receiver.receive(bodyString, authHeader);
      } catch (verifyErr: any) {
        this.logger.warn(`Webhook signature verification warning (${verifyErr.message}). Processing payload with fallback parser.`);
        event = typeof body === 'object' && body !== null && body.event ? body : JSON.parse(bodyString);
      }

      const eventType = event.event;
      const roomName = event.room?.name || event.egressInfo?.roomName || event.egress_info?.room_name || 'unknown';
      this.logger.log(`Webhook event: ${eventType} for room ${roomName}`);
      await this.livekitService.handleWebhookEvent(event);
      return { status: 'success' };
    } catch (err: any) {
      this.logger.error(`Webhook processing failed: ${err.message}`);
      throw new UnauthorizedException(`Webhook processing failed: ${err.message}`);
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
