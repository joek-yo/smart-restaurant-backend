// src/modules/checkout/application/use-cases/cancel-checkout.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class CancelCheckoutUseCase {
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

    session.reset();

    await this.sessionPort.save(session);

    return {
      cancelled: true,
      sessionId: session.id,
    };
  }
}