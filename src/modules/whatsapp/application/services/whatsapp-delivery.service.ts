// src/modules/whatsapp/application/services/whatsapp-delivery.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppRetryService } from './whatsapp-retry.service';

/**
 * WhatsAppDeliveryService
 * -----------------------
 * Central outbound messaging adapter.
 *
 * RULES:
 * - NO business logic
 * - NO decision making
 * - ONLY delivery orchestration
 * - MUST be retry-safe
 */
export interface WhatsAppOutboundMessage {
  to: string;
  message: string;
  tenantId: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class WhatsAppDeliveryService {
  private readonly logger = new Logger(WhatsAppDeliveryService.name);

  constructor(
    private readonly retry: WhatsAppRetryService,
  ) {}

  /**
   * Main send pipeline
   */
  async send(outbound: WhatsAppOutboundMessage): Promise<{
    success: boolean;
    messageId?: string;
  }> {
    this.logger.log(
      `[WHATSAPP SEND] to=${outbound.to} tenant=${outbound.tenantId}`,
    );

    return this.retry.execute(async () => {
      // ─────────────────────────────────────────────
      // SIMULATED PROVIDER CALL (replace with Twilio / Meta API / Gupshup)
      // ─────────────────────────────────────────────
      const response = await this.fakeProviderSend(outbound);

      if (!response.success) {
        throw new Error('WhatsApp delivery failed');
      }

      return {
        success: true,
        messageId: response.messageId,
      };
    });
  }

  /**
   * Bulk safe send (for notifications, order updates, etc.)
   */
  async sendBulk(
    messages: WhatsAppOutboundMessage[],
  ): Promise<void> {
    for (const msg of messages) {
      try {
        await this.send(msg);
      } catch (err) {
        this.logger.error(
          `[WHATSAPP BULK FAIL] to=${msg.to}`,
          err as any,
        );
        // intentionally continue (no cascade failure)
      }
    }
  }

  /**
   * Provider abstraction layer
   * Replace this with real WhatsApp API integration.
   */
  private async fakeProviderSend(
    outbound: WhatsAppOutboundMessage,
  ): Promise<{ success: boolean; messageId: string }> {
    // simulate latency
    await new Promise((res) => setTimeout(res, 150));

    return {
      success: true,
      messageId: `wa_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
  }
}