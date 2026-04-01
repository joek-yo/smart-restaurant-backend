// src/common/events/order.events.ts
import { Injectable } from '@nestjs/common';
import { EventBus } from './event-bus';

@Injectable()
export class OrderEvents {
  constructor(private readonly eventBus: EventBus) {}

  orderCreated(order: { orderId: string; customerId: string; totalAmount: number }) {
    this.eventBus.emit('order.created', order);
  }

  orderCompleted(order: { orderId: string; customerId: string; totalAmount: number }) {
    this.eventBus.emit('order.completed', order);
  }
}