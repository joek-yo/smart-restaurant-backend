// src/modules/checkout/application/services/checkout-validation.service.ts

/**
 * CheckoutValidationService
 * -------------------------
 * CENTRALIZED BUSINESS RULE CHECKS
 */

export class CheckoutValidationService {

  validateCartNotEmpty(items: any[]) {
    if (!items || items.length === 0) {
      throw new Error('Cart is empty');
    }
  }

  validateItemQuantity(quantity: number) {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than zero');
    }
  }

  validateCheckoutAllowed(state: string) {
    if (state === 'LOCKED') {
      throw new Error('Checkout is locked');
    }
  }
}