// 📁 src/domains/sessions/events/quantity-updated.event.ts

import { CartItem } from '../entities/cart-item.entity';

export class QuantityUpdatedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cartItem: CartItem,
    public readonly oldQuantity: number,
    public readonly newQuantity: number,
  ) {}
}