// src/modules/checkout/application/event-handlers/checkout-failed.handler.ts

import { Injectable } from '@nestjs/common';

/**
 * CHECKOUT FAILED HANDLER
 * -----------------------
 * Side effects:
 * - recovery snapshot creation
 * - retry suggestions
 * - error tracking
 */

@Injectable()
export class CheckoutFailedHandler {
  async handle(event: any): Promise<void> {
    const { tenantId, userId, reason } = event;

    console.log('[CHECKOUT FAILED]', {
      tenantId,
      userId,
      reason,
    });

    // 🔮 Future:
    // - store failure snapshot in Redis
    // - trigger recovery flow
    // - send WhatsApp "resume checkout" message
    // - log to monitoring system
  }
}