import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '@modules/notifications/entities/notification.entity';
import { WebWhatsAppProvider } from '../../../../infrastructure/notifications/providers/whatsapp/web.provider';

/**
 * SendWebHandler
 *
 * Handles sending messages via Web WhatsApp (fallback / marketing)
 */
@Injectable()
export class SendWebHandler {
  private readonly logger = new Logger(SendWebHandler.name);

  constructor(private readonly webProvider: WebWhatsAppProvider) {}

  async send(notification: Notification): Promise<void> {
    this.logger.log(`Sending WEB WhatsApp message → ${notification.recipient}`);

    const payload = notification.payload.toObject();

    try {
      await this.webProvider.sendMessage({
        to: notification.recipient,
        message: this.buildMessage(payload),
      });

      this.logger.log(`WEB WhatsApp message sent → ${notification.recipient}`);
    } catch (error) {
      this.logger.error(
        `WEB WhatsApp send failed → ${notification.recipient}`,
        (error as any).stack,
      );
      throw error;
    }
  }

  private buildMessage(payload: {
    message?: string;
    title?: string;
    templateName?: string;
    templateParams?: Record<string, any>;
  }): string {
    if (payload.message) return payload.message;

    if (payload.templateName && payload.templateParams) {
      return this.renderTemplate(payload.templateName, payload.templateParams);
    }

    return 'Message not available';
  }

  private renderTemplate(templateName: string, params: Record<string, any>): string {
    let message = `📢 ${templateName}\n`;
    for (const [key, value] of Object.entries(params)) {
      message += `• ${key}: ${value}\n`;
    }
    return message;
  }
}