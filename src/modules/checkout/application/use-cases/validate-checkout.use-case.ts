// src/modules/checkout/application/use-cases/validate-checkout.use-case.ts

import { Injectable } from '@nestjs/common';
import { CheckoutValidationService } from '../services/checkout-validation.service';
import { SessionService } from '@modules/sessions/application/services/session.service';

/**
 * ValidateCheckoutUseCase
 * -----------------------
 * Ensures checkout is safe to proceed.
 */

@Injectable()
export class ValidateCheckoutUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly validation: CheckoutValidationService,
  ) {}

  async execute(input: { userId: string }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    // Validate cart not empty
    this.validation.validateCartNotEmpty(session.items);

    // Validate checkout state
    this.validation.validateCheckoutAllowed(session.state);

    return {
      valid: true,
      sessionId: session.id,
    };
  }
}