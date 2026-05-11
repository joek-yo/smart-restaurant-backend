// src/modules/checkout/application/use-cases/generate-checkout-summary.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CheckoutSummaryService } from '../services/checkout-summary.service';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class GenerateCheckoutSummaryUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
    private readonly summaryService: CheckoutSummaryService,
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

    const summary = this.summaryService.build(session.items);

    return {
      sessionId: session.id,
      summary,
      state: session.state,
    };
  }
}