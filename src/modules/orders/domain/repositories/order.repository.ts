// src/modules/orders/domain/repositories/order.repository.ts

import { Order } from '@modules/orders/domain/entities/order.entity';

/**
 * Domain contract for Order persistence.
 * Pure interface — no implementation here.
 */
export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  update(id: string, partial: Partial<Order>): Promise<Order>;
  delete(id: string): Promise<void>;
  findByBusinessId(businessId: string): Promise<Order[]>;
}
