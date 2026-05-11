// src/modules/checkout/application/services/checkout-summary.service.ts

import { Injectable } from '@nestjs/common';
import { CartItemEntity } from '@modules/sessions/domain/entities/cart-item.entity';
import { MoneyVO } from '../../domain/value-objects/money.vo';

export interface CheckoutSummary {
  items: CartItemEntity[];
  subtotal: MoneyVO;
  itemCount: number;
}

/**
 * CheckoutSummaryService
 * ----------------------
 * Builds final checkout breakdown.
 * Pure domain service — no SessionService dependency.
 */
@Injectable()
export class CheckoutSummaryService {
  build(items: CartItemEntity[]): CheckoutSummary {
    const subtotalValue = items.reduce((sum, i) => sum + i.total, 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

    return {
      items,
      subtotal: new MoneyVO(subtotalValue),
      itemCount,
    };
  }
}