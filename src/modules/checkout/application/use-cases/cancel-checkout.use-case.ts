// src/modules/checkout/application/use-cases/cancel-checkout.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

/**
 * CancelCheckoutUseCase
 * ----------------------
 * Rolls back checkout state safely
 */

@Injectable()
export class CancelCheckoutUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: { userId: string }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    // Reset session state + cart
    session.reset();

    await this.sessionService.save(session);

    return {
      cancelled: true,
      sessionId: session.id,
    };
  }
}