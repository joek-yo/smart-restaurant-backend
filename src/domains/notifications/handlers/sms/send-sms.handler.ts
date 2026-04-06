// src/domains/notifications/handlers/sms/send-sms.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';
// ✅ fixed import path
import { SmsProvider } from '../../../../infrastructure/notifications/providers/sms/sms.provider';

/**
 * SendSmsHandler
 *
 * Handles sending SMS notifications
 */
@Injectable()
export class SendSmsHandler {
  private readonly logger = new Logger(SendSmsHandler.name);

  constructor(private readonly smsProvider: SmsProvider) {}

  async send(notification: Notification): Promise<void> {
    this.logger.log(`Sending SMS → ${notification.recipient}`);

    try {
      await this.smsProvider.send({
        to: notification.recipient,
        message: notification.payload.message || 'No message content',
      });

      this.logger.log(`SMS sent → ${notification.recipient}`);
    } catch (error) {
      // ✅ cast unknown error
      this.logger.error(
        `SMS send failed → ${notification.recipient}`,
        (error as any).stack,
      );
      throw error;
    }
  }
}