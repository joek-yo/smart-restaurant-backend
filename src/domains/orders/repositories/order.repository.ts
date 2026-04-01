// 📁 File: src/domains/orders/repositories/order.repository.ts

import { Order } from '../entities/order.entity';

export interface OrderRepository {
  /**
   * Persists a new order to the database.
   */
  create(order: Order): Promise<Order>;

  /**
   * Retrieves a single order by its unique ID.
   */
  findById(id: string): Promise<Order | null>;

  /**
   * Updates an existing order by ID with partial data.
   */
  update(id: string, partial: Partial<Order>): Promise<Order>;

  /**
   * Optional: Retrieves all orders belonging to a specific tenant/business.
   */
  findByTenantId?(tenantId: string): Promise<Order[]>;
}