// src/modules/checkout/application/services/cart-calculation.service.ts

import { Injectable } from '@nestjs/common';
import { CartItemEntity } from '@modules/sessions/domain/entities/cart-item.entity';
import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * CartCalculationService
 * -----------------------
 * PURE DOMAIN SERVICE — no session dependency.
 *
 * Responsibility:
 * - Compute item totals
 * - Compute cart totals
 * - Framework-agnostic (usable by API / WhatsApp / AI agents)
 */
@Injectable()
export class CartCalculationService {
  calculateTotal(items: CartItemEntity[]): MoneyVO {
    const total = items.reduce((sum, item) => sum + item.total, 0);
    return new MoneyVO(total);
  }

  calculateItemTotal(price: number, quantity: number): MoneyVO {
    return new MoneyVO(price * quantity);
  }

  assertNotEmpty(items: CartItemEntity[]): void {
    if (!items || items.length === 0) {
      throw new Error('Cart is empty');
    }
  }
}