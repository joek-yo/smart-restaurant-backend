// src/modules/checkout/application/ports/checkout-order.port.ts

import { Order } from '@modules/orders/domain/entities/order.entity';
import { SessionEntity } from '@modules/sessions/domain/entities/session.entity';

/**
 * CheckoutOrderPort
 * ------------------
 * Abstraction layer between Checkout and Orders module.
 *
 * PURPOSE:
 * - decouple checkout from order implementation
 * - allow swapping order engine without touching checkout
 * - enforce clean dependency direction
 *
 * RULES:
 * ❌ NO business logic here
 * ❌ NO session mutation here
 * ❌ NO event emission here
 *
 * ONLY:
 * - contract definition
 */

export const CHECKOUT_ORDER_PORT = 'CHECKOUT_ORDER_PORT';

export interface CheckoutOrderPort {
  /**
   * Create order from session
   */
  createFromSession(session: SessionEntity): Promise<Order>;

  /**
   * Check if an order already exists for a session (idempotency guard)
   */
  findBySessionId(sessionId: string): Promise<Order | null>;

  /**
   * Optional: validate order readiness before creation
   */
  validateSessionForOrder(session: SessionEntity): Promise<boolean>;
}