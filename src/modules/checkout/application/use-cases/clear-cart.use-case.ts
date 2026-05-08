// src/modules/checkout/application/use-cases/clear-cart.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';

/**
 * ClearCartUseCase
 * -----------------
 * Resets cart completely.
 */

@Injectable()
export class ClearCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string) {
    const session = await this.sessionService.getOrCreate(userId);

    session.reset();

    await this.sessionService.save(session);

    return session;
  }
}