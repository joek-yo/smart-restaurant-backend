/**
 * FILE: src/modules/checkout/domain/entities/checkout-summary.entity.ts
 *
 * 📊 CHECKOUT SUMMARY ENTITY
 * --------------------------
 * Read-only projection for UI / WhatsApp / API responses.
 */

import { CartEntity } from './cart.entity';
import { CheckoutStatus } from '../value-objects/checkout-status.vo';

export class CheckoutSummaryEntity {
  constructor(
    public readonly userId: string,
    public readonly status: CheckoutStatus,
    public readonly cart: CartEntity,
  ) {}

  toResponse() {
    return {
      status: this.status,
      items: this.cart.getItems(),
      total: this.cart.getTotal().breakdown,
      isEmpty: this.cart.isEmpty(),
    };
  }
}
