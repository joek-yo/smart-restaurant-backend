// src/domains/notifications/handlers/push/send-push.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '@modules/notifications/entities/notification.entity';
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
      await this.pushProvider.send({
        to: notification.recipient,
        title: payload.title || 'Notification',
        message: payload.message || '',
      });

      this.logger.log(`Push sent → ${notification.recipient}`);
    } catch (error) {
      this.logger.error(
        `Push failed → ${notification.recipient}`,
        (error as any).stack,
      );

      throw error;
    }
  }
}