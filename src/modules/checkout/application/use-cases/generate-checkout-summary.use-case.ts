// src/modules/checkout/application/use-cases/generate-checkout-summary.use-case.ts

import { Injectable } from '@nestjs/common';
import { CheckoutSummaryService } from '../services/checkout-summary.service';
import { SessionService } from '@modules/sessions/application/services/session.service';

/**
 * GenerateCheckoutSummaryUseCase
 * ------------------------------
 * Builds final review snapshot BEFORE confirmation
 */

@Injectable()
export class GenerateCheckoutSummaryUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly summaryService: CheckoutSummaryService,
  ) {}

  async execute(input: { userId: string }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    const summary = this.summaryService.build(session.items);

    return {
      sessionId: session.id,
      summary,
      state: session.state,
    };
  }
}