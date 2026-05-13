// FILE: src/modules/conversation/infrastructure/adapters/whatsapp/whatsapp-send-reply.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { WhatsAppDeliveryService } from './whatsapp-delivery.service';
import { WhatsAppRateLimitService } from './whatsapp-rate-limit.service';

@Injectable()
export class WhatsAppSendReplyService {
  private readonly logger = new Logger(WhatsAppSendReplyService.name);

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
    reason?: string;
  }> {
    const { tenantId, userId, phone, message } = params;

    // ==================================================
    // 🚦 RATE LIMIT PROTECTION ONLY
    // ==================================================

    const allowed = await this.rateLimit.allow(tenantId, userId);

    if (!allowed) {
      this.logger.warn(
        `[WhatsAppSendReply] rate limit exceeded user=${userId}`,
      );

      return {
        success: false,
        blocked: true,
        reason: 'rate_limited',
      };
    }

    // ==================================================
    // 📤 DELIVERY EXECUTION
    // ==================================================

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