// src/infrastructure/notifications/providers/email.provider.ts

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);

  async send(to: string, subject: string, body: string) {
    try {
      // Replace with actual email sending API
      this.logger.log(`Sending Email to ${to}: ${subject} | ${body}`);
      return { success: true, provider: 'Email' };
    } catch (err) {
      this.logger.error(`Failed to send Email to ${to}`, err);
      throw err;
    }
  }
}