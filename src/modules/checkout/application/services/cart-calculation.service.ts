// src/modules/checkout/application/services/cart-calculation.service.ts

import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * CartCalculationService
 * -----------------------
 * PURE DOMAIN ORCHESTRATION SERVICE
 *
 * Responsibility:
 * - Calculate cart totals
 * - Aggregate item pricing
 * - Avoid duplication across use-cases
 */

export class CartCalculationService {
  calculateTotal(items: Array<{ price: number; quantity: number }>): MoneyVO {
    const total = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    return new MoneyVO(total);
  }

  calculateItemTotal(price: number, quantity: number): MoneyVO {
    return new MoneyVO(price * quantity);
  }
}