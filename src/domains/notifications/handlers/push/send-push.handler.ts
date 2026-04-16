// src/domains/notifications/handlers/push/send-push.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';
import { PushProvider } from '../../../../infrastructure/notifications/providers/push.provider';

/**
 * SendPushHandler
 *
 * Handles push notification delivery (mobile/web)
 */
@Injectable()
export class SendPushHandler {
  private readonly logger = new Logger(SendPushHandler.name);

  constructor(private readonly pushProvider: PushProvider) {}

  async send(notification: Notification): Promise<void> {
    this.logger.log(`Sending PUSH → ${notification.recipient}`);

    const payload = notification.payload.toObject();

    try {
      // ✅ Only include metadata if provider supports it
      await this.pushProvider.send({
        to: notification.recipient,
        title: payload.title || 'Notification',
        message: payload.message || '',
        // metadata: payload.metadata, // ✅ remove if unsupported
      });

      this.logger.log(`Push sent → ${notification.recipient}`);
    } catch (error) {
      // ✅ cast unknown error
      this.logger.error(
        `Push failed → ${notification.recipient}`,
        (error as any).stack,
      );

      throw error;
    }
  }
}