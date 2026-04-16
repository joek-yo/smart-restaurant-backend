// src/domains/notifications/handlers/whatsapp/send-waba.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../../entities/notification.entity';
import { WabaProvider } from '../../../../infrastructure/notifications/providers/whatsapp/waba.provider';

/**
 * SendWabaHandler
 *
 * Handles sending WhatsApp messages via WABA (Official API)
 */
@Injectable()
export class SendWabaHandler {
  private readonly logger = new Logger(SendWabaHandler.name);

  constructor(private readonly wabaProvider: WabaProvider) {}

  async send(notification: Notification): Promise<void> {
    this.logger.log(`Sending WABA message → ${notification.recipient}`);

    const payload = notification.payload.toObject();

    try {
      // Template or plain text
      if (payload.templateName) {
        await this.wabaProvider.sendTemplate({
          to: notification.recipient,
          templateName: payload.templateName,
          params: payload.templateParams || {},
        });
      } else {
        await this.wabaProvider.sendText({
          to: notification.recipient,
          message: payload.message || '',
        });
      }

      this.logger.log(`WABA message sent → ${notification.recipient}`);
    } catch (error) {
      this.logger.error(
        `WABA send failed → ${notification.recipient}`,
        (error as any).stack,
      );
      throw error;
    }
  }
}