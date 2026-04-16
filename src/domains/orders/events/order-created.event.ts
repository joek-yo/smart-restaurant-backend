import { Order } from '../entities/order.entity';

/**
 * Event emitted whenever a new order is successfully persisted.
 * Carrying the full Order entity prevents "double-querying" the DB in listeners.
 */
export class OrderCreatedEvent {
  constructor(
    public readonly order: Order
  ) {}
}