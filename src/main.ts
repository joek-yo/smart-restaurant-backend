import * as dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ GLOBAL VALIDATION (THIS FIXES YOUR ERRORS)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,       // strips unknown fields
      transform: true,       // converts types (string → number)
      forbidNonWhitelisted: false,
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 5000;

  // --------------------------
  // Swagger Setup
  // --------------------------
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AI Restaurant API')
    .setDescription('Menu & Orders API documentation')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  console.log('Swagger docs available at http://localhost:' + port + '/api');

  // --------------------------
  // Start server
  // --------------------------
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
}

void bootstrap();