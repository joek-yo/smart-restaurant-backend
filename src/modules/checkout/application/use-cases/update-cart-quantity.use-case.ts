// src/modules/checkout/application/use-cases/update-cart-quantity.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

/**
 * UpdateCartQuantityUseCase
 * -------------------------
 * Updates quantity of an existing cart item.
 */

@Injectable()
export class UpdateCartQuantityUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: {
    userId: string;
    productId: string;
    quantity: number;
  }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    session.updateQuantity(input.productId, input.quantity);

    await this.sessionService.save(session);

    return session;
  }
}