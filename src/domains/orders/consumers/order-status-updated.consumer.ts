// src/domains/orders/consumers/order-status-updated.consumer.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '../../../common/events/event-bus';
import { OrderStatusUpdatedEvent } from '../events/order-status-updated.event';

@Injectable()
export class OrderStatusUpdatedConsumer implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    // Listen to status update events
    this.eventBus.on('OrderStatusUpdatedEvent', (event: OrderStatusUpdatedEvent) => {
      console.log(`[Consumer] Status Update for Order: ${event.order.id}`);
      
      // Here you can call downstream services:
      // - Notify kitchen / staff
      // - Send WhatsApp / SMS updates
      // - Trigger any other domain reaction
      // Example pseudo-code:
      // this.kitchenService.updateOrderStatus(event.order);
      // this.notificationService.notifyCustomer(event.order);
    });
  }
}