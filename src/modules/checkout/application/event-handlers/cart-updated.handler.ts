// src/modules/checkout/application/event-handlers/cart-updated.handler.ts

import { Injectable } from '@nestjs/common';
import { CartUpdatedPayload } from '@core/events/event-payloads';

@Injectable()
export class CartUpdatedHandler {
  async handle(event: CartUpdatedPayload): Promise<void> {
    const { tenantId, userId, cart } = event;

    console.log('[CART UPDATED]', {
      tenantId,
      userId,
      items: cart?.items?.length,
      total: cart?.total,
    });

    // 🔮 Future: analytics, live cart UI, recommendation engine
  }
}