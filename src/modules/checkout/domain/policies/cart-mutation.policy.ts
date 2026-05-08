/**
 * FILE: src/modules/checkout/domain/policies/cart-mutation.policy.ts
 *
 * 🛒 CART MUTATION POLICY
 * -----------------------
 * Prevents invalid cart operations BEFORE they hit entities.
 */

import { CartEntity } from '../entities/cart.entity';

export class CartMutationPolicy {

  static canAddItem(cart: CartEntity, quantity: number): {
    allowed: boolean;
    reason?: string;
  } {
    if (quantity <= 0) {
      return {
        allowed: false,
        reason: 'Quantity must be greater than 0',
      };
    }

    if (quantity > 100) {
      return {
        allowed: false,
        reason: 'Quantity exceeds limit (100)',
      };
    }

    return { allowed: true };
  }

  static canRemoveItem(cart: CartEntity, productId: string) {
    const exists = cart.getItems().some(i => i.productId === productId);

    if (!exists) {
      return {
        allowed: false,
        reason: 'Item does not exist in cart',
      };
    }

    return { allowed: true };
  }

  static canUpdateQuantity(quantity: number) {
    if (quantity < 0) {
      return {
        allowed: false,
        reason: 'Quantity cannot be negative',
      };
    }

    return { allowed: true };
  }
}
