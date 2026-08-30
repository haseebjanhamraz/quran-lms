import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    try {
      const isConnected = this.connection.readyState === 1;
      if (!isConnected) {
        throw new Error('Database connection state is not connected');
      }
      return {
        status: 'UP',
        database: 'CONNECTED',
        timestamp: new Date().toISOString(),
      };
    } catch (err: any) {
      throw new ServiceUnavailableException({
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  @Get('version')
  getVersion() {
    return {
      version: '1.6.0',
      name: 'Quran-LMS-Server',
      buildTimestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      nodeVersion: process.version,
    };
  }
}
