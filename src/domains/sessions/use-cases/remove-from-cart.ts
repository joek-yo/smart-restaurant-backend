// src/modules/sessions/use-cases/remove-from-cart.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionsService } from '../sessions.service';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(private readonly sessionsService: SessionsService) {}

  execute(phone: string, productId: string) {
    const session = this.sessionsService.getSession(phone);

    const existingItem = session.cart.find(
      (item) => item.productId === productId,
    );

    if (!existingItem) {
      throw new NotFoundException('Item not found in cart');
    }

    // Remove item
    session.cart = session.cart.filter(
      (item) => item.productId !== productId,
    );

    return {
      message: 'Item removed from cart',
      cart: session.cart,
    };
  }
}