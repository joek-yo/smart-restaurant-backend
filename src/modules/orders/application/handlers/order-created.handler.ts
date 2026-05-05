// src/modules/orders/application/handlers/order-created.handler.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events';

@Injectable()
export class OrderCreatedHandler implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    this.eventBus.on('order.created', this.handle.bind(this));
  }

  handle(payload: any) {
    console.log(`[Handler] Order created: ${payload.orderId}`);
  }
}
