// src/modules/checkout/application/event-handlers/checkout-failed.handler.ts

import { Injectable } from '@nestjs/common';
import { CheckoutFailedPayload } from '@core/events/event-payloads';

@Injectable()
export class CheckoutFailedHandler {
  async handle(event: CheckoutFailedPayload): Promise<void> {
    const { tenantId, userId, reason } = event;

    console.log('[CHECKOUT FAILED]', { tenantId, userId, reason });

    // 🔮 Future: Redis snapshot, recovery flow, WhatsApp "resume checkout"
  }
}