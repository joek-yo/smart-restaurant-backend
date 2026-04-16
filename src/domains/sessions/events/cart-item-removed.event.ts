// 📁 src/domains/sessions/events/cart-item-removed.event.ts

import { CartItemVO } from '../value-objects/cart-item.vo';
import { SessionStateVO } from '../value-objects/session-state.vo';

/**
 * Event emitted when a cart item is removed from a session.
 */
export class CartItemRemovedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cartItem: CartItemVO,
    public readonly sessionState: SessionStateVO,
    public readonly timestamp: Date = new Date(),
  ) {}
}