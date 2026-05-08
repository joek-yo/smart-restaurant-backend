/**
 * FILE: src/modules/checkout/domain/events/cart-updated.event.ts
 *
 * 🛒 CART UPDATED EVENT
 * ---------------------
 * Fired whenever cart state changes.
 * PURE CONTRACT ONLY.
 */

import { CartEntity } from '../entities/cart.entity';

export class CartUpdatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cart: CartEntity,
    public readonly timestamp: Date = new Date(),
  ) {}
}
