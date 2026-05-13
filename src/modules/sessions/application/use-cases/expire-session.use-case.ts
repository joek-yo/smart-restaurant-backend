// FILE: src/modules/sessions/application/use-cases/expire-session.use-case.ts

import { Injectable } from '@nestjs/common';

import { SessionExpiryService } from '../services/session-expiry.service';

export interface ExpireSessionInput {
  sessionId: string;
  reason?: string;
}

@Injectable()
export class ExpireSessionUseCase {
  constructor(
    private readonly sessionExpiryService: SessionExpiryService,
  ) {}

  async execute(input: ExpireSessionInput) {
    const session = await this.sessionExpiryService.evaluate(
      input.sessionId,
    );

    return {
      success: true,
      sessionId: session.id,
      state: session.state.value,
      expiredAt: new Date(),
      reason: input.reason ?? 'SESSION_TTL_EXPIRED',
    };
  }
}