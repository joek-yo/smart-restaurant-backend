// 📁 src/infrastructure/notifications/providers/push.provider.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);

  async send(input: { to: string; title: string; message: string }) {
    this.logger.log(`(MOCK) Sending PUSH → ${input.to}: ${input.title} | ${input.message}`);
  }
}