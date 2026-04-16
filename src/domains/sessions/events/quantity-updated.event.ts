// 📁 src/domains/sessions/events/quantity-updated.event.ts

import { CartItemVO } from '../value-objects/cart-item.vo';
import { SessionStateVO } from '../value-objects/session-state.vo';

export class QuantityUpdatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cartItem: CartItemVO,
    public readonly oldQuantity: number,
    public readonly newQuantity: number,
    public readonly sessionState: SessionStateVO,
    public readonly timestamp: Date = new Date(),
  ) {}
}