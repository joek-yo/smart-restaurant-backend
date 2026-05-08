// src/modules/checkout/application/use-cases/start-checkout.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

/**
 * StartCheckoutUseCase
 * ---------------------
 * Moves cart into checkout mode (pre-validation state)
 */

@Injectable()
export class StartCheckoutUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: { userId: string }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    // Safety check: cannot checkout empty cart
    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot start checkout with empty cart');
    }

    // Transition state (domain entity owns rules)
    session.checkout();

    await this.sessionService.save(session);

    return {
      sessionId: session.id,
      state: session.state,
    };
  }
}