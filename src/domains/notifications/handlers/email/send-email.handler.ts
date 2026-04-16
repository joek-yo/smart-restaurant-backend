// src/domains/notifications/handlers/email/send-email.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';
import { EmailProvider } from '../../../../infrastructure/notifications/providers/email.provider';

/**
 * SendEmailHandler
 *
 * Handles email delivery
 */
@Injectable()
export class SendEmailHandler {
  private readonly logger = new Logger(SendEmailHandler.name);

  constructor(private readonly emailProvider: EmailProvider) {}

  async send(notification: Notification): Promise<void> {
    this.logger.log(`Sending Email → ${notification.recipient}`);

    const payload = notification.payload.toObject();

    try {
      // ✅ Fixed: pass 3 arguments instead of object
      await this.emailProvider.send(
        notification.recipient,
        payload.title || 'Notification',
        payload.message || '',
      );

      this.logger.log(`Email sent → ${notification.recipient}`);
    } catch (error) {
      // ✅ Fixed: cast unknown error to any
      this.logger.error(
        `Email failed → ${notification.recipient}`,
        (error as any).stack,
      );

      throw error;
    }
  }
}