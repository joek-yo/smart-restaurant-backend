import * as dns from 'node:dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') || 5000;

  console.log('PORT:', port);

  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
}

void bootstrap();
