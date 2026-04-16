// 📁 src/domains/sessions/events/cart-item-added.event.ts

import { CartItemVO } from '../value-objects/cart-item.vo';
import { SessionStateVO } from '../value-objects/session-state.vo';

/**
 * Event emitted when a cart item is added to a session.
 * Payload contains the cart item details and the session context.
 */
export class CartItemAddedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cartItem: CartItemVO,
    public readonly sessionState: SessionStateVO,
    public readonly timestamp: Date = new Date(),
  ) {}
}