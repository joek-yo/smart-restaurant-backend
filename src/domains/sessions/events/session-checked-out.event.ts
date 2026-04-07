// 📁 src/domains/sessions/events/session-checked-out.event.ts

import { CartItem } from '../entities/cart-item.entity';

export class SessionCheckedOutEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly items: CartItem[],
    public readonly totalAmount: number,
    public readonly timestamp: Date = new Date(),
  ) {}
}