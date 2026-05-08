// src/modules/checkout/application/use-cases/remove-item-from-cart.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

/**
 * RemoveItemFromCartUseCase
 * --------------------------
 * Removes product from session cart.
 */

@Injectable()
export class RemoveItemFromCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: { userId: string; productId: string }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    session.removeItem(input.productId);

    await this.sessionService.save(session);

    return session;
  }
}