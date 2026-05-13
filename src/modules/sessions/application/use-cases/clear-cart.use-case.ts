// FILE: src/modules/sessions/application/use-cases/clear-cart.use-case.ts

import { Injectable } from '@nestjs/common';

import { CartService } from '../services/cart.service';

export interface ClearCartInput {
  sessionId: string;
}

@Injectable()
export class ClearCartUseCase {
  constructor(
    private readonly cartService: CartService,
  ) {}

  async execute(input: ClearCartInput) {
    const session = await this.cartService.clear(
      input.sessionId,
    );

    return {
      success: true,
      sessionId: session.id,
      state: session.state.value,
      totalItems: 0,
      totalAmount: 0,
      items: [],
    };
  }
}