import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';

@Injectable()
export class ScheduleGateway implements OnModuleInit, OnModuleDestroy {
  private wss: WebSocketServer;
  private readonly logger = new Logger(ScheduleGateway.name);

  onModuleInit() {
    const wsPort = Number(process.env.WS_PORT) || 5001;
    this.wss = new WebSocketServer({ port: wsPort, host: '0.0.0.0' });
    this.logger.log(`Schedule WebSocket Gateway initialized on 0.0.0.0:${wsPort}`);

    this.wss.on('connection', (ws: WebSocket) => {
      this.logger.log('Client connected to Schedule WebSocket Gateway');

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.logger.log(`Received message: ${data.event}`);
        } catch (_) {}
      });

      ws.on('close', () => {
        this.logger.log('Client disconnected from Schedule WebSocket Gateway');
      });

      ws.on('error', (err) => {
        this.logger.error(`WebSocket connection error: ${err.message}`);
      });
    });
  }

  onModuleDestroy() {
    if (this.wss) {
      this.wss.close();
    }
  }

  broadcastScheduleUpdate(action: string, payload: any, senderClientId?: string) {
    if (!this.wss) return;

    const data = JSON.stringify({
      event: 'schedule_update',
      action,
      payload,
      senderClientId,
      timestamp: new Date().toISOString(),
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }
}
