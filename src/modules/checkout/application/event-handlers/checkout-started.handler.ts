// src/modules/checkout/application/event-handlers/checkout-started.handler.ts

import { Injectable } from '@nestjs/common';
import { CheckoutStartedPayload } from '@core/events/event-payloads';

@Injectable()
export class CheckoutStartedHandler {
  async handle(event: CheckoutStartedPayload): Promise<void> {
    const { tenantId, userId } = event;

    console.log('[CHECKOUT STARTED]', { tenantId, userId });

    // 🔮 Future: funnel tracking, WhatsApp "review order", checkout snapshot
  }
}