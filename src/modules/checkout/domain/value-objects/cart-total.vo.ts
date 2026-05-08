/**
 * FILE: src/modules/checkout/domain/value-objects/cart-total.vo.ts
 *
 * 🛒 Cart Total Value Object
 * --------------------------
 * Handles all cart-level financial computation.
 * Uses MoneyVO internally for safety.
 */

import { MoneyVO } from './money.vo';

export class CartTotalVO {
  private readonly subtotal: MoneyVO;
  private readonly tax: MoneyVO;
  private readonly discount: MoneyVO;

  constructor(
    subtotal: MoneyVO,
    tax: MoneyVO = new MoneyVO(0),
    discount: MoneyVO = new MoneyVO(0),
  ) {
    this.subtotal = subtotal;
    this.tax = tax;
    this.discount = discount;
  }

  get total(): MoneyVO {
    return this.subtotal
      .add(this.tax)
      .subtract(this.discount);
  }

  get breakdown() {
    return {
      subtotal: this.subtotal.value,
      tax: this.tax.value,
      discount: this.discount.value,
      total: this.total.value,
    };
  }

  applyDiscount(discount: MoneyVO): CartTotalVO {
    return new CartTotalVO(this.subtotal, this.tax, discount);
  }

  addTax(tax: MoneyVO): CartTotalVO {
    return new CartTotalVO(this.subtotal, tax, this.discount);
  }
}
