// src/modules/orders/application/handlers/order-status-updated.handler.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events';

@Injectable()
export class OrderStatusUpdatedHandler implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    this.eventBus.on('order.status.updated', this.handle.bind(this));
  }

  handle(payload: any) {
    console.log(`[Handler] Order ${payload.orderId} status changed to ${payload.status}`);
  }
}
