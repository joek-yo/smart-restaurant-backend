/**
 * FILE: src/modules/checkout/domain/events/checkout-started.event.ts
 *
 * 🚀 CHECKOUT STARTED EVENT
 * -------------------------
 * Fired when user enters checkout flow.
 */

import { CartEntity } from '../entities/cart.entity';

export class CheckoutStartedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cart: CartEntity,
    public readonly startedAt: Date = new Date(),
  ) {}
}
