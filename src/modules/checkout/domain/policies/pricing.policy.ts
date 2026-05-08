/**
 * FILE: src/modules/checkout/domain/policies/pricing.policy.ts
 *
 * 💰 PRICING POLICY
 * -----------------
 * Ensures pricing consistency and prevents tampering.
 */

import { CartEntity } from '../entities/cart.entity';

export class PricingPolicy {

  static validate(cart: CartEntity): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    const items = cart.getItems();

    for (const item of items) {
      // =========================
      // RULE 1: Negative price
      // =========================
      if (item.price.value < 0) {
        issues.push(`Negative price detected for ${item.productId}`);
      }

      // =========================
      // RULE 2: Missing name
      // =========================
      if (!item.name) {
        issues.push(`Missing product name for ${item.productId}`);
      }

      // =========================
      // RULE 3: Quantity sanity
      // =========================
      if (item.quantity > 1000) {
        issues.push(`Suspicious quantity for ${item.productId}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  static recalculate(cart: CartEntity) {
    // pure recomputation trigger (no mutation)
    return cart.getTotal();
  }
}
