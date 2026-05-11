// src/modules/checkout/application/use-cases/start-checkout.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class StartCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
  ) {}

  async execute(input: {
    userId: string;
    tenantId: string;
    branchId?: string;
  }) {
    const session = await this.sessionPort.getOrCreate(
      input.userId,
      input.tenantId,
      input.branchId,
    );

    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot start checkout with empty cart');
    }

    session.checkout();

    await this.sessionPort.save(session);

    return {
      sessionId: session.id,
      state: session.state,
    };
  }
}