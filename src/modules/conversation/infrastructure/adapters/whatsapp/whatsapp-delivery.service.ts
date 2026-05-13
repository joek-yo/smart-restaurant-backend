// FILE: src/modules/conversation/infrastructure/adapters/whatsapp/whatsapp-delivery.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppRetryService } from './whatsapp-retry.service';

export interface WhatsAppOutboundMessage {
  to: string;
  message: string;
  tenantId: string;

  metadata?: {
    userId?: string;
    [key: string]: any;
  };
}

@Injectable()
export class WhatsAppDeliveryService {
  private readonly logger = new Logger(WhatsAppDeliveryService.name);

  constructor(
    private readonly retry: WhatsAppRetryService,
  ) {}

  async send(
    outbound: WhatsAppOutboundMessage,
  ): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    this.logger.log(
      `[WhatsAppDelivery] to=${outbound.to} tenant=${outbound.tenantId}`,
    );

    return this.retry.execute(async () => {
      const response = await this.providerSend(outbound);

      if (!response.success) {
        throw new Error('WhatsApp delivery failed');
      }

      return {
        success: true,
        messageId: response.messageId,
      };
    });
  }

  async sendBulk(messages: WhatsAppOutboundMessage[]): Promise<void> {
    for (const msg of messages) {
      try {
        await this.send(msg);
      } catch (err) {
        this.logger.error(
          `[WhatsAppDelivery] bulk fail to=${msg.to}`,
          err as any,
        );
      }
    }
  }

  // ==================================================
  // 📡 PROVIDER LAYER (Meta / Twilio / Gupshup)
  // ==================================================
  private async providerSend(
    outbound: WhatsAppOutboundMessage,
  ): Promise<{
    success: boolean;
    messageId: string;
  }> {
    await new Promise((r) => setTimeout(r, 150));

    this.logger.log(
      `[WHATSAPP OUTBOUND] To: ${outbound.to} | Content: ${outbound.message}`,
    );

    return {
      success: true,
      messageId: `wa_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`,
    };
  }
}