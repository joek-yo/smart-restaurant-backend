// src/modules/checkout/application/use-cases/validate-checkout.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CheckoutValidationService } from '../services/checkout-validation.service';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class ValidateCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
    private readonly validation: CheckoutValidationService,
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

    this.validation.validateSession(session, input.tenantId);

    return {
      valid: true,
      sessionId: session.id,
    };
  }
}