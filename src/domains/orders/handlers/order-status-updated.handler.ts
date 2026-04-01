// src/domains/orders/handlers/order-status-updated.handler.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBus } from '../../../common/events/event-bus';
import { OrderStatusUpdatedEvent } from '../events/order-status-updated.event';

@Injectable()
export class OrderStatusUpdatedHandler implements OnModuleInit {
  constructor(private readonly eventBus: EventBus) {}

  onModuleInit() {
    // Subscribe to status update events on module init
    this.eventBus.on('OrderStatusUpdatedEvent', this.handle.bind(this));
  }

  handle(event: OrderStatusUpdatedEvent) {
    console.log(
      `[Handler] Order ${event.order.id} status changed from ${event.previousStatus} to ${event.newStatus}`,
    );

    // ✅ Example: notify gateway or other external services
    // ordersGateway.emitStatusUpdated(event.order.id, event.previousStatus, event.newStatus);
  }
}