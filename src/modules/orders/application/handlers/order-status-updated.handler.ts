// src/modules/orders/application/handlers/order-status-updated.handler.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events';
import { ORDER_EVENTS } from '@core/events/event.constants';
import { OrderStatusUpdatedPayload } from '@core/events/event-payloads';

@Injectable()
export class OrderStatusUpdatedHandler implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    this.eventBus.on(ORDER_EVENTS.ORDER_STATUS_UPDATED, this.handle.bind(this));
  }

  handle(payload: OrderStatusUpdatedPayload): void {
    console.log(`[Handler] Order ${payload.orderId} status → ${payload.status}`);

    // 🔮 Future: push notifications, kitchen display update, analytics
  }
}