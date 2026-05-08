/**
 * FILE: src/modules/checkout/domain/policies/checkout-validation.policy.ts
 *
 * 🚦 CHECKOUT VALIDATION POLICY
 * -----------------------------
 * Determines if checkout is allowed.
 * PURE RULES ONLY (no side effects).
 */

import { CartEntity } from '../entities/cart.entity';

export class CheckoutValidationPolicy {

  static canProceed(cart: CartEntity): {
    allowed: boolean;
    reason?: string;
  } {
    // =========================
    // RULE 1: Empty cart
    // =========================
    if (cart.isEmpty()) {
      return {
        allowed: false,
        reason: 'Cart is empty',
      };
    }

    // =========================
    // RULE 2: Zero or invalid totals
    // =========================
    const total = cart.getTotal().total.value;

    if (total <= 0) {
      return {
        allowed: false,
        reason: 'Invalid cart total',
      };
    }

    // =========================
    // RULE 3: Quantity sanity check
    // =========================
    const invalidItem = cart.getItems().find(i => i.quantity <= 0);

    if (invalidItem) {
      return {
        allowed: false,
        reason: `Invalid quantity for ${invalidItem.productId}`,
      };
    }

    return {
      allowed: true,
    };
  }
}
