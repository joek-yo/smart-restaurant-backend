// src/modules/checkout/application/event-handlers/checkout-confirmed.handler.ts

import { Injectable } from '@nestjs/common';
import { CheckoutConfirmedPayload } from '@core/events/event-payloads';

@Injectable()
export class CheckoutConfirmedHandler {
  async handle(event: CheckoutConfirmedPayload): Promise<void> {
    const { tenantId, userId, orderDraft } = event;

    console.log('[CHECKOUT CONFIRMED]', {
      tenantId,
      userId,
      orderId: orderDraft?.id,
    });

    // 🔮 Future: WhatsApp confirmation, payment init, analytics
  }
}