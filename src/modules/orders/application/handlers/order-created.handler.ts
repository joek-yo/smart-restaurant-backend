// src/modules/orders/application/handlers/order-created.handler.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus, EVENTS } from '@core/events';
import { OrderCreatedPayload } from '@core/events/event-payloads';

@Injectable()
export class OrderCreatedHandler implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    this.eventBus.on(EVENTS.ORDER_CREATED, this.handle.bind(this));
  }

  handle(payload: OrderCreatedPayload): void {
    console.log(`[Handler] Order created: ${payload.orderId} tenant=${payload.businessId} total=${payload.totalAmount}`);

    // 🔮 Future: notifications, analytics, kitchen display system
  }
}