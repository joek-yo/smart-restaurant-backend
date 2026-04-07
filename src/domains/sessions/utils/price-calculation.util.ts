// 📁 src/domains/sessions/utils/price-calculation.util.ts

import { CartItemVO } from '../value-objects/cart-item.vo';
import { DiscountVO } from '../value-objects/discount.vo';

export class PriceCalculationUtil {
  /**
   * Calculate subtotal for a list of cart items
   */
  static calculateSubtotal(items: CartItemVO[]): number {
    return items.reduce((sum, item) => sum + item.total, 0);
  }

  /**
   * Calculate total after applying discount
   */
  static calculateTotal(items: CartItemVO[], discount?: DiscountVO): number {
    const subtotal = this.calculateSubtotal(items);
    return discount ? discount.apply(subtotal) : subtotal;
  }

  /**
   * Calculate total for a single cart item with optional discount
   */
  static calculateItemTotal(item: CartItemVO, discount?: DiscountVO): number {
    const total = item.total;
    return discount ? discount.apply(total) : total;
  }
}