// 📁 src/domains/sessions/utils/validation.util.ts

import { CartItemVO } from '../value-objects/cart-item.vo';
import { CartItemEntity } from '../entities/cart-item.entity';

export class ValidationUtil {
  /**
   * Validate cart item quantity and options
   */
  static validateCartItem(item: CartItemVO | CartItemEntity) {
    if (!item.productId) throw new Error('Product ID is required');
    if (item.quantity <= 0) throw new Error('Quantity must be at least 1');
    if (item.price < 0) throw new Error('Price cannot be negative');
    if (item.options && typeof item.options !== 'object') {
      throw new Error('Options must be an object');
    }
  }

  /**
   * Validate entire cart items array
   */
  static validateCartItems(items: (CartItemVO | CartItemEntity)[]) {
    if (!Array.isArray(items)) throw new Error('Items must be an array');
    items.forEach(this.validateCartItem);
  }

  /**
   * Validate that a string is non-empty
   */
  static validateNonEmptyString(value: string, fieldName: string) {
    if (!value || value.trim() === '') {
      throw new Error(`${fieldName} cannot be empty`);
    }
  }
}