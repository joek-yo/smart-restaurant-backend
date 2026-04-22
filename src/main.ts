// FILE: src/main.ts

import * as dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}

void bootstrap();