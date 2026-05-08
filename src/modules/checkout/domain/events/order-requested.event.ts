/**
 * FILE: src/modules/checkout/domain/events/order-requested.event.ts
 *
 * 📦 ORDER REQUESTED EVENT
 * ------------------------
 * Bridge event between Checkout → Order system.
 * This is where checkout ends and order begins.
 */

import { CartEntity } from '../entities/cart.entity';

export class OrderRequestedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly cart: CartEntity,
    public readonly total: number,
    public readonly requestedAt: Date = new Date(),
  ) {}
}
