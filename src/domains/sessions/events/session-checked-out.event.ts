// 📁 src/domains/sessions/events/session-checked-out.event.ts

import { CartItemVO } from '../value-objects/cart-item.vo';

export class SessionCheckedOutEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly items: CartItemVO[],
    public readonly totalAmount: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}