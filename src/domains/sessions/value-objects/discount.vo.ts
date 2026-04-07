// 📁 src/domains/sessions/value-objects/discount.vo.ts

/**
 * Defines the structure of a discount
 * - PERCENTAGE: discount.value = 10 means 10%
 * - FIXED: discount.value = amount to subtract
 */
export interface Discount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number; // percentage (10 = 10%) or fixed amount
  businessId?: string; // optional: multi-business support
  branchId?: string;   // optional: multi-branch support
}

/**
 * Value Object representing a discount applied to a session or cart
 * Immutable operations wherever possible
 */
export class DiscountVO {
  private readonly discount?: Discount;

  constructor(discount?: Discount) {
    this.discount = discount ? { ...discount } : undefined;
  }

  /**
   * Applies the discount to a given amount
   * @param amount Original amount
   * @returns discounted amount
   */
  apply(amount: number): number {
    if (!this.discount) return amount;

    switch (this.discount.type) {
      case 'PERCENTAGE':
        return amount - amount * (this.discount.value / 100);
      case 'FIXED':
        return Math.max(0, amount - this.discount.value); // prevent negative totals
      default:
        return amount;
    }
  }

  /**
   * Checks if discount is active
   */
  isActive(): boolean {
    return !!this.discount;
  }

  /**
   * Returns discount metadata safely
   */
  getInfo(): Discount | undefined {
    return this.discount ? { ...this.discount } : undefined;
  }
}