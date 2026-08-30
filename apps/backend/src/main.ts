import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 4000;

  // Support LiveKit webhook content types (application/webhook+json) and capture raw body buffer
  app.use(bodyParser.json({
    type: ['application/json', 'application/webhook+json', 'application/*+json'],
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }));

  app.use(cookieParser());

  // Serve static uploads directory for profile photos & media
  const express = require('express');
  const path = require('path');
  const fs = require('fs');
  const uploadsPath = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
  const materialsPath = path.join(uploadsPath, 'materials');
  const avatarsPath = path.join(uploadsPath, 'avatars');
  if (!fs.existsSync(materialsPath)) {
    fs.mkdirSync(materialsPath, { recursive: true });
  }
  if (!fs.existsSync(avatarsPath)) {
    fs.mkdirSync(avatarsPath, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsPath));
  app.use('/api/v1/uploads', express.static(uploadsPath));

  // Global prefixes and settings
  app.setGlobalPrefix('api/v1');

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map(o => o.trim()) : true,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
