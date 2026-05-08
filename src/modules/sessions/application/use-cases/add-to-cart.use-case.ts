/**
 * FILE: src/domains/sessions/use-cases/add-to-cart.use-case.ts
 */

import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';

@Injectable()
export class AddToCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * 🧠 EXECUTION LAYER ONLY
   * This use-case does NOT decide anything.
   * It only applies a command from the Conversation Engine.
   */
  async execute(userId: string, item: CartItemEntity): Promise<void> {
    // 1. Load session (pure state)
    const session = await this.sessionService.getOrCreate(userId);

    // 2. Mutate domain entity (cart logic stays inside entity, NOT service)
    session.addItem(item);

    // 3. Persist updated session (no business logic here)
    await this.sessionService.update(session.id!, {
      items: session.items,
      state: session.state,
    });
  }
}