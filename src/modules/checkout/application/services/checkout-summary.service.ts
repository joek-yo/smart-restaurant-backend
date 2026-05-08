// src/modules/checkout/application/services/checkout-summary.service.ts

import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * CheckoutSummaryService
 * ----------------------
 * Builds final checkout breakdown
 */

export class CheckoutSummaryService {

  build(items: Array<{ name: string; price: number; quantity: number }>) {
    const subtotal = items.reduce((sum, i) => {
      return sum + i.price * i.quantity;
    }, 0);

    return {
      items,
      subtotal: new MoneyVO(subtotal),
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }
}