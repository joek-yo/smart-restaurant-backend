// FILE: src/modules/conversation/infrastructure/adapters/whatsapp/whatsapp-event.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@core/events';
import { WHATSAPP_EVENTS, CHECKOUT_EVENTS, ORDER_EVENTS } from '@core/events/event.constants';
import { WhatsAppSendReplyService } from './whatsapp-send-reply.service';
import { WhatsAppRetryService } from './whatsapp-retry.service';
import { WhatsAppDeliveryService } from './whatsapp-delivery.service';

@Injectable()
export class WhatsAppEventListener {
  private readonly logger = new Logger(WhatsAppEventListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly sendReply: WhatsAppSendReplyService,
    private readonly retry: WhatsAppRetryService,
    private readonly delivery: WhatsAppDeliveryService,
  ) {
    this.registerListeners();
  }

  private registerListeners(): void {
    // ── CONVERSATION RESPONSE ───────────────────────────
    this.eventBus.on(WHATSAPP_EVENTS.CONVERSATION_RESPONSE_READY, async (payload) => {
      await this.handleReply(payload);
    });

    // ── CHECKOUT STARTED ────────────────────────────────
    this.eventBus.on(CHECKOUT_EVENTS.CHECKOUT_STARTED, async (payload) => {
      await this.handleReply({
        tenantId: payload.tenantId,
        userId: payload.userId,
        phone: payload.phone,
        message: '🛒 Checkout started. Please confirm your order when ready.',
      });
    });

    // ── ORDER EVENTS ────────────────────────────────────
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

    // ── DELIVERY FAILURE + DEAD LETTER ──────────────────
    this.eventBus.on(WHATSAPP_EVENTS.WHATSAPP_DELIVERY_FAILED, async (payload) => {
      const attempt = payload.attempt ?? 1;
      this.logger.error(`[WhatsAppEventListener] delivery failed to=${payload.phone} attempt=${attempt}`);

      if (attempt < 3) {
        await this.retry.execute(() =>
          this.delivery.send({
            to: payload.phone,
            tenantId: payload.tenantId,
            message: payload.message,
            metadata: { retry: attempt + 1, reason: 'delivery_failure_recovery' },
          }),
        );
        return;
      }

      this.eventBus.emit(WHATSAPP_EVENTS.WHATSAPP_DELIVERY_DEAD_LETTER, {
        ...payload,
      });
      this.logger.warn(`[WhatsAppEventListener] dead letter to=${payload.phone} after ${attempt} attempts`);
    });
  }

  private async handleReply(payload: { tenantId: string; userId: string; phone: string; message: string }): Promise<void> {
    try {
      const result = await this.sendReply.execute(payload);
      this.logger.log(`[WhatsAppEventListener] reply sent to=${payload.phone} success=${result.success}`);
    } catch (err) {
      this.logger.error(`[WhatsAppEventListener] reply failed to=${payload.phone}`, err as any);
    }
  }
}
