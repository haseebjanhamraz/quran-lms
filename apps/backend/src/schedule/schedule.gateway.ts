import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { WebSocketServer, WebSocket } from 'ws';

interface ClientMetadata {
  userId?: string;
  role?: string;
}

@Injectable()
export class ScheduleGateway implements OnModuleInit, OnModuleDestroy {
  private wss: WebSocketServer;
  private readonly logger = new Logger(ScheduleGateway.name);
  private readonly clientMap = new Map<WebSocket, ClientMetadata>();

  onModuleInit() {
    const wsPort = Number(process.env.WS_PORT) || 5001;
    try {
      this.wss = new WebSocketServer({ port: wsPort, host: '0.0.0.0' });
      this.logger.log(`Schedule & Realtime WebSocket Gateway initialized on 0.0.0.0:${wsPort}`);

      this.wss.on('connection', (ws: WebSocket) => {
        this.clientMap.set(ws, {});
        this.logger.log('Client connected to Realtime WebSocket Gateway');

        ws.on('message', (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            // Handle client identification / registration for targeted messaging
            if (data.event === 'register' || data.event === 'auth') {
              const meta = this.clientMap.get(ws) || {};
              if (data.userId) meta.userId = data.userId.toString();
              if (data.role) meta.role = data.role.toString();
              this.clientMap.set(ws, meta);
              this.logger.log(`Socket registered user ${meta.userId} with role ${meta.role}`);
              ws.send(JSON.stringify({ event: 'registered', success: true }));
            }
          } catch (_) {}
        });

        ws.on('close', () => {
          this.clientMap.delete(ws);
          this.logger.log('Client disconnected from Realtime WebSocket Gateway');
        });

        ws.on('error', (err) => {
          this.clientMap.delete(ws);
          this.logger.error(`WebSocket connection error: ${err.message}`);
        });
      });
    } catch (err: any) {
      this.logger.error(`Failed to start WebSocket server: ${err.message}`);
    }
  }

  onModuleDestroy() {
    if (this.wss) {
      this.wss.close();
    }
  }

  // Broadcast schedule update
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

  // Broadcast leave update (or targeted to specific teacher + admins)
  broadcastLeaveUpdate(action: string, payload: any, targetTeacherId?: string) {
    if (!this.wss) return;

    const data = JSON.stringify({
      event: 'leave_update',
      action,
      payload,
      targetTeacherId,
      timestamp: new Date().toISOString(),
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  }

  // Targeted message to a specific user (e.g. Teacher)
  sendToUser(userId: string, event: string, payload: any) {
    if (!this.wss || !userId) return;

    const data = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    let sent = false;
    this.clientMap.forEach((meta, ws) => {
      if (meta.userId === userId.toString() && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
        sent = true;
      }
    });

    if (!sent) {
      this.logger.debug(`User ${userId} currently has no active WebSocket connections`);
    }
  }

  // Targeted message to specific roles (e.g. ['ADMIN', 'SUPER_ADMIN'])
  sendToRoles(roles: string[], event: string, payload: any) {
    if (!this.wss) return;

    const data = JSON.stringify({
      event,
      payload,
      timestamp: new Date().toISOString(),
    });

    this.clientMap.forEach((meta, ws) => {
      if (meta.role && roles.includes(meta.role) && ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}
