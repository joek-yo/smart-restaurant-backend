// src/modules/checkout/application/services/cart-calculation.service.ts

import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * CartCalculationService
 * -----------------------
 * PURE DOMAIN SERVICE (NO SESSION DEPENDENCY)
 *
 * Responsibility:
 * - Compute item totals
 * - Compute cart totals
 * - Remain framework-agnostic (usable by API / WhatsApp / AI agents)
 */

export class CartCalculationService {
  /**
   * Calculate total cart value from items
   */
  calculateTotal(
    items: Array<{ price: number; quantity: number }>,
  ): MoneyVO {
    const total = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    return new MoneyVO(total);
  }

  /**
   * Calculate single item total
   */
  calculateItemTotal(price: number, quantity: number): MoneyVO {
    return new MoneyVO(price * quantity);
  }

  /**
   * Optional helper: safe guard for empty carts
   */
  assertNotEmpty(items: Array<any>) {
    if (!items || items.length === 0) {
      throw new Error('Cart is empty');
    }
  }
}