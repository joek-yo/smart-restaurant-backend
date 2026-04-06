// 📁 src/infrastructure/notifications/providers/email.provider.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  async send(input: { to: string; subject: string; body: string }) {
    this.logger.log(`(MOCK) Sending EMAIL → ${input.to}: ${input.subject} | ${input.body}`);
  }
}