// src/domains/orders/repositories/order.repository.ts

import { Order } from '../entities/order.entity';

export interface OrderRepository {
  // =========================
  // CORE PERSISTENCE
  // =========================

  create(order: Order): Promise<Order>;

  findById(id: string): Promise<Order | null>;

  /**
   * Standardized partial update contract.
   * NOTE: Only partial fields should be passed, NOT full entity replacement logic.
   */
  update(id: string, partial: Partial<Order>): Promise<Order>;

  delete(id: string): Promise<void>;

  // =========================
  // QUERY METHODS
  // =========================

  /**
   * Get all orders for a business (multi-tenant isolation)
   */
  findByBusinessId(businessId: string): Promise<Order[]>;
}