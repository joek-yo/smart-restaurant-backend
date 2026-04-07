// 📁 src/domains/sessions/events/cart-item-removed.event.ts

import { CartItem } from '../entities/cart-item.entity';

export class CartItemRemovedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cartItem: CartItem,
  ) {}
}