/**
 * FILE: src/modules/checkout/domain/events/checkout-failed.event.ts
 *
 * ❌ CHECKOUT FAILED EVENT
 * -----------------------
 * Fired when checkout validation or process fails.
 */

import { CartEntity } from '../entities/cart.entity';

export class CheckoutFailedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cart: CartEntity,
    public readonly reason: string,
    public readonly failedAt: Date = new Date(),
  ) {}
}
