// src/domains/orders/handlers/order-created.handler.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '../../../common/events/event-bus';
import { OrderCreatedEvent } from '../events/order-created.event';

@Injectable()
export class OrderCreatedHandler implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    // Subscribe to events on module init
    this.eventBus.on('OrderCreatedEvent', this.handle.bind(this));
  }

  handle(event: OrderCreatedEvent) {
    const { order } = event;
    console.log(`[Handler] Order created: ${order.id} for ${order.customerName}`);

    // ✅ Example: trigger other services without touching the core domain
    // this.kitchenService.notify(order);
    // this.whatsappService.sendNewOrder(order);
  }
}