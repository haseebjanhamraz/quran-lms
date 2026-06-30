import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 4000;

  app.use(cookieParser());

  // Global prefixes and settings
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: true, // Allow all origins for dev; can be tightened later
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
