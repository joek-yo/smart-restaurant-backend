// 📁 src/domains/sessions/utils/discount-calculation.util.ts

import { DiscountVO } from '../value-objects/discount.vo';

export class DiscountCalculationUtil {
  /**
   * Apply a discount to an amount
   */
  static applyDiscount(amount: number, discount?: DiscountVO): number {
    if (!discount || !discount.isActive()) return amount;
    return discount.apply(amount);
  }

  /**
   * Check if a discount is valid for a given amount
   */
  static isDiscountApplicable(amount: number, discount?: DiscountVO): boolean {
    if (!discount || !discount.isActive()) return false;

    const totalAfterDiscount = discount.apply(amount);
    return totalAfterDiscount >= 0;
  }
}