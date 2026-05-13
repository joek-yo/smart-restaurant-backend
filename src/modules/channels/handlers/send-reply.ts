// src/modules/channels/handlers/send-reply.ts

import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppDeliveryService } from '../application/services/whatsapp-delivery.service';
import { WhatsAppRateLimitService } from '../application/services/whatsapp-rate-limit.service';

/**
 * SendReplyUseCase
 * -----------------
 * EVENT-SAFE outbound reply handler.
 *
 * RULES:
 * - No business logic
 * - No conversation decisions
 * - Only safe delivery execution
 * - Must respect rate limits + retry safety
 */
@Injectable()
export class SendReplyUseCase {
  private readonly logger = new Logger(SendReplyUseCase.name);

  constructor(
    private readonly delivery: WhatsAppDeliveryService,
    private readonly rateLimit: WhatsAppRateLimitService,
  ) {}

  async execute(params: {
    tenantId: string;
    userId: string;
    phone: string;
    message: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    blocked?: boolean;
  }> {
    const { tenantId, userId, phone, message } = params;

    // ─────────────────────────────────────────────
    // 🔐 RATE LIMIT PROTECTION
    // ─────────────────────────────────────────────
    const allowed = await this.rateLimit.allow(tenantId, userId);

    if (!allowed) {
      this.logger.warn(
        `[WHATSAPP BLOCKED] rate limit exceeded user=${userId}`,
      );

      return {
        success: false,
        blocked: true,
      };
    }

    // ─────────────────────────────────────────────
    // 🚀 SAFE DELIVERY VIA CENTRAL GATEWAY
    // ─────────────────────────────────────────────
    const result = await this.delivery.send({
      to: phone,
      tenantId,
      message,
      metadata: {
        userId,
        source: 'conversation-reply',
      },
    });

    return {
      success: result.success,
      messageId: result.messageId,
    };
  }
}