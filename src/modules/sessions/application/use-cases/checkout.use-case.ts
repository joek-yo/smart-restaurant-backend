/**
 * FILE: src/domains/sessions/use-cases/checkout.use-case.ts
 */

import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class CheckoutUseCase {
  constructor(private readonly sessionService: SessionService) {}

  /**
   * 🧠 EXECUTION LAYER ONLY
   * This use-case does NOT decide WHEN checkout happens.
   * It only applies checkout command from Conversation Engine.
   */
  async execute(userId: string): Promise<void> {
    // 1. Load session (pure state retrieval)
    const session = await this.sessionService.getOrCreate(userId);

    // 2. Domain mutation (business rule lives in entity)
    session.checkout();

    // 3. Persist only state change (no logic in service)
    await this.sessionService.update(session.id!, {
      state: session.state,
    });
  }
}