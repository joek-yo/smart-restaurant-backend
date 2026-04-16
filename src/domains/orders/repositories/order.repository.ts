// src/domains/orders/repositories/order.repository.ts

import { Order } from '../entities/order.entity';

export interface OrderRepository {
  // =========================
  // CORE PERSISTENCE
  // =========================

  create(order: Order): Promise<Order>;

  findById(id: string): Promise<Order | null>;

  /**
   * Performs a partial update on an Order.
   */
  update(id: string, data: Partial<Order>): Promise<Order>;

  // Kept for administrative cleanup/tests
  delete(id: string): Promise<void>;

  // =========================
  // QUERY METHODS (STILL MVP RELEVANT)
  // =========================

  // Essential for multi-tenant isolation (seeing "my business" orders)
  findByBusinessId(businessId: string): Promise<Order[]>;
}