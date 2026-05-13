// FILE: src/modules/sessions/application/use-cases/remove-cart-item.use-case.ts

import { Injectable } from '@nestjs/common';

import { CartService } from '../services/cart.service';

export interface RemoveCartItemInput {
  sessionId: string;
  productId: string;
}

@Injectable()
export class RemoveCartItemUseCase {
  constructor(
    private readonly cartService: CartService,
  ) {}

  async execute(input: RemoveCartItemInput) {
    const session = await this.cartService.removeItem(
      input.sessionId,
      input.productId,
    );

    return {
      success: true,
      sessionId: session.id,
      state: session.state.value,
      totalItems: session.items.length,
      totalAmount: session.totalAmount,
      items: session.items,
    };
  }
}