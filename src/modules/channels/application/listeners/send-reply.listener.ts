// src/modules/channels/application/listeners/send-reply.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@core/events';
import { WHATSAPP_EVENTS, CHECKOUT_EVENTS, ORDER_EVENTS } from '@core/events/event.constants';

import { SendReplyUseCase } from '../../handlers/send-reply';
import { WhatsAppDeliveryService } from '../services/whatsapp-delivery.service';

/**
 * SendReplyListener
 * ------------------
 * LISTENS TO CONVERSATION OUTPUT SIGNALS ONLY
 *
 * RULES:
 * - No business logic
 * - No intent handling
 * - No state mutation
 * - Only outbound message delivery orchestration
 */
@Injectable()
export class SendReplyListener {
  private readonly logger = new Logger(SendReplyListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly sendReply: SendReplyUseCase,
    private readonly delivery: WhatsAppDeliveryService,
  ) {
    this.registerListeners();
  }

  private registerListeners() {
    // ─────────────────────────────────────────────
    // 💬 CONVERSATION RESPONSE EVENT
    // ─────────────────────────────────────────────
    this.eventBus.on(WHATSAPP_EVENTS.CONVERSATION_RESPONSE_READY, async (payload) => {
      await this.handleReply(payload);
    });

    // ─────────────────────────────────────────────
    // 🛒 CHECKOUT CONFIRMATION SIGNAL
    // ─────────────────────────────────────────────
    this.eventBus.on(CHECKOUT_EVENTS.CHECKOUT_STARTED, async (payload) => {
      await this.handleReply({
        tenantId: payload.tenantId,
        userId: payload.userId,
        phone: payload.phone,
        message: '🛒 Checkout started. Please confirm your order when ready.',
      });
    });

    // ─────────────────────────────────────────────
    // 💳 ORDER EVENTS → USER NOTIFICATION
    // ─────────────────────────────────────────────
    this.eventBus.on(ORDER_EVENTS.ORDER_CREATED, async (payload) => {
      await this.handleReply({
        tenantId: payload.businessId,
        userId: payload.customerId,
        phone: payload.phone,
        message: '🎉 Your order has been created successfully!',
      });
    });

    this.eventBus.on(ORDER_EVENTS.ORDER_CANCELLED, async (payload) => {
      await this.handleReply({
        tenantId: payload.businessId,
        userId: payload.userId,
        phone: payload.phone,
        message: '❌ Your order was cancelled.',
      });
    });
  }

  /**
   * Unified reply handler
   */
  private async handleReply(payload: {
    tenantId: string;
    userId: string;
    phone: string;
    message: string;
  }) {
    try {
      // Preferred path (safe orchestration + rate limit + delivery)
      const result = await this.sendReply.execute({ tenantId: payload.tenantId, userId: payload.userId, phone: payload.phone, message: payload.message });

      this.logger.log(
        `[WHATSAPP REPLY SENT] to=${payload.phone} success=${result.success}`,
      );
    } catch (err) {
      this.logger.error(
        `[WHATSAPP REPLY FAILED] to=${payload.phone}`,
        err as any,
      );
    }
  }
}