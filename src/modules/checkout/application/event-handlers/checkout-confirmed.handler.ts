// src/modules/checkout/application/event-handlers/checkout-confirmed.handler.ts

import { Injectable } from '@nestjs/common';

/**
 * CHECKOUT CONFIRMED HANDLER
 * --------------------------
 * Side effects:
 * - trigger order creation pipeline
 * - send confirmation notifications
 * - analytics conversion tracking
 */

@Injectable()
export class CheckoutConfirmedHandler {
  async handle(event: any): Promise<void> {
    const { tenantId, userId, orderDraft } = event;

    console.log('[CHECKOUT CONFIRMED]', {
      tenantId,
      userId,
      orderId: orderDraft?.id,
    });

    // 🔥 Future integrations:
    // - CreateOrderFromCheckoutUseCase trigger
    // - WhatsApp confirmation message
    // - Payment initialization (if needed)
    // - analytics: checkout_success
  }
}