// 📁 File: src/domains/orders/events/order-status-updated.event.ts

import { Order } from '../entities/order.entity';
import { OrderStatus } from '../entities/order-status.enum';

export class OrderStatusUpdatedEvent {
  constructor(
    public readonly order: Order,
    public readonly previousStatus: OrderStatus,
    public readonly newStatus: OrderStatus,
  ) {}
}