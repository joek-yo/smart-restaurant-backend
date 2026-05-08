/**
 * FILE: src/modules/checkout/domain/entities/order-draft.entity.ts
 *
 * 📦 ORDER DRAFT ENTITY
 * ---------------------
 * Immutable snapshot before final order creation.
 */

import { CartEntity } from './cart.entity';
import { CartTotalVO } from '../value-objects/cart-total.vo';

export class OrderDraftEntity {
  constructor(
    public readonly draftId: string,
    public readonly userId: string,
    public readonly cart: CartEntity,
    public readonly total: CartTotalVO,
  ) {}

  getSummary() {
    return {
      items: this.cart.getItems(),
      total: this.total.breakdown,
    };
  }
}
