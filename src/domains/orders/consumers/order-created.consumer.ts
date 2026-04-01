// src/domains/orders/consumers/order-created.consumer.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '../../../common/events/event-bus';
import { OrderCreatedEvent } from '../events/order-created.event';

@Injectable()
export class OrderCreatedConsumer implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    // Listen to OrderCreatedEvent via EventBus
    this.eventBus.on('OrderCreatedEvent', (event: OrderCreatedEvent) => {
      console.log(`[Consumer] Handling OrderCreated for orderId: ${event.order.id}`);

      // Here you can call other services:
      // - Notify kitchen
      // - Send WhatsApp/SMS
      // - Trigger other domain reactions

      // Example (pseudo code):
      // this.kitchenService.notifyNewOrder(event.order);
      // this.whatsappService.sendOrderNotification(event.order);
    });
  }
}