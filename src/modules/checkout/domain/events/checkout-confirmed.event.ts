/**
 * FILE: src/modules/checkout/domain/events/checkout-confirmed.event.ts
 *
 * ✅ CHECKOUT CONFIRMED EVENT
 * ---------------------------
 * Fired when checkout is successfully validated.
 */

import { CartEntity } from '../entities/cart.entity';

export class CheckoutConfirmedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cart: CartEntity,
    public readonly total: number,
    public readonly confirmedAt: Date = new Date(),
  ) {}
}
