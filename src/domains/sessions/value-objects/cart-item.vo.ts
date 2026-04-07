// 📁 src/domains/sessions/events/cart-item-added.event.ts

import { CartItemVO } from '../value-objects/cart-item.vo';

/**
 * Event triggered whenever a cart item is added to a session.
 * Payload includes the user ID, session ID, and the CartItemVO.
 */
export class CartItemAddedEvent {
  /** User who owns the session */
  public readonly userId: string;

  /** ID of the session where the item was added */
  public readonly sessionId: string;

  /** The cart item that was added */
  public readonly cartItem: CartItemVO;

  /** Timestamp of when the event was created */
  public readonly timestamp: Date;

  constructor(userId: string, sessionId: string, cartItem: CartItemVO, timestamp?: Date) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.cartItem = cartItem;
    this.timestamp = timestamp ?? new Date();
  }
}