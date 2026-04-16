// 📁 src/domains/sessions/policies/validation-policy.ts

import { Injectable } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import { CartItemEntity } from '../entities/cart-item.entity';

@Injectable()
export class ValidationPolicy {
  /**
   * Validate session before critical operations
   */
  validateSession(session: SessionEntity): void {
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.userId) {
      throw new Error('Invalid session: missing userId');
    }
  }

  /**
   * Validate cart item before adding/updating
   */
  validateCartItem(item: CartItemEntity): void {
    if (!item.productId) {
      throw new Error('Cart item must have a productId');
    }

    if (item.quantity <= 0) {
      throw new Error('Cart item quantity must be greater than 0');
    }

    if (item.price < 0) {
      throw new Error('Cart item price cannot be negative');
    }
  }

  /**
   * Ensure session has items before checkout
   */
  validateCheckout(session: SessionEntity): void {
    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot checkout an empty cart');
    }
  }

  /**
   * Validate quantity update
   */
  validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
  }
}