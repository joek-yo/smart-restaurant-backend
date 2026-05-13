// src/modules/checkout/application/use-cases/start-checkout.use-case.ts

import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  CheckoutSessionPort,
  CHECKOUT_SESSION_PORT,
} from '../ports/checkout-session.port';

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

    // ─────────────────────────────────────────────
    // 🔒 LOCK AWARENESS (do not allow checkout override)
    // ─────────────────────────────────────────────
    const lockedStates = [
      'PAYMENT_PENDING',
      'ORDER_CONFIRMED',
    ];

    if (lockedStates.includes(session.state?.value)) {
      throw new BadRequestException(
        `Checkout is locked in state: ${session.state.value}`,
      );
    }

    // ─────────────────────────────────────────────
    // 🧠 RECOVERY AWARENESS
    // If session was abandoned, resume instead of restarting
    // ─────────────────────────────────────────────
    // ─────────────────────────────────────────────
    // 🛒 VALIDATION: cart must not be empty
    // ─────────────────────────────────────────────
    if (!session.items || session.items.length === 0) {
      throw new BadRequestException(
        'Cannot start checkout with empty cart',
      );
    }

    // ─────────────────────────────────────────────
    // 🚀 STATE TRANSITION
    // ─────────────────────────────────────────────
    try {
      session.checkoutStart();
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : 'Invalid checkout transition',
      );
    }

    // ─────────────────────────────────────────────
    // 💾 PERSIST SESSION
    // ─────────────────────────────────────────────
    await this.sessionPort.save(session);

    // ─────────────────────────────────────────────
    // 📤 RESPONSE
    // ─────────────────────────────────────────────
    return {
      sessionId: session.id,
      state: session.state,
      recovery: session.recovery ?? null,
    };
  }
}