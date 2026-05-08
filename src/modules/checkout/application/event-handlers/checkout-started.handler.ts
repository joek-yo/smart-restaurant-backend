// src/modules/checkout/application/event-handlers/checkout-started.handler.ts

import { Injectable } from '@nestjs/common';

/**
 * CHECKOUT STARTED HANDLER
 * ------------------------
 * Side effects:
 * - lock checkout session
 * - snapshot state
 * - tracking funnel conversion
 */

@Injectable()
export class CheckoutStartedHandler {
  async handle(event: any): Promise<void> {
    const { tenantId, userId } = event;

    console.log('[CHECKOUT STARTED]', { tenantId, userId });

    // 🔮 Future:
    // - mark funnel step STARTED
    // - send WhatsApp "review order" message
    // - create checkout snapshot
  }
}