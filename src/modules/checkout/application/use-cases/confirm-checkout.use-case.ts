// src/modules/checkout/application/use-cases/confirm-checkout.use-case.ts

import {
  Injectable,
  Inject,
  BadRequestException,
} from '@nestjs/common';

import {
  CheckoutSessionPort,
  CHECKOUT_SESSION_PORT,
} from '../ports/checkout-session.port';

import { CreateOrderFromCheckoutUseCase } from './create-order-from-checkout.use-case';

@Injectable()
export class ConfirmCheckoutUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
    private readonly createOrder: CreateOrderFromCheckoutUseCase,
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
    // 🔒 IDEMPOTENCY / PAYMENT SAFETY GUARD
    // Prevent double confirmation or re-processing
    // ─────────────────────────────────────────────
    const lockedStates = [
      'PAYMENT_PENDING',
      'ORDER_CONFIRMED',
    ];

    if (lockedStates.includes(session.state?.value ?? session.state)) {
      throw new BadRequestException(
        `Checkout already locked in state: ${
          session.state?.value ?? session.state
        }`,
      );
    }

    // ─────────────────────────────────────────────
    // 🛒 EMPTY CART CHECK
    // ─────────────────────────────────────────────
    if (!session.items || session.items.length === 0) {
      throw new BadRequestException(
        'Cannot confirm checkout with empty cart',
      );
    }

    // ─────────────────────────────────────────────
    // 🚀 SAFE STATE TRANSITION
    // ─────────────────────────────────────────────
    try {
      session.checkoutStart();
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error
          ? err.message
          : 'Invalid checkout state transition',
      );
    }

    // ─────────────────────────────────────────────
    // 💾 PERSIST CHECKOUT STATE FIRST (CRITICAL)
    // ─────────────────────────────────────────────
    await this.sessionPort.save(session);

    // ─────────────────────────────────────────────
    // 📦 CREATE ORDER (SIDE EFFECT ISOLATED)
    // ─────────────────────────────────────────────
    const order = await this.createOrder.execute(session);

    // ─────────────────────────────────────────────
    // 📤 RESPONSE
    // ─────────────────────────────────────────────
    return {
      success: true,
      orderId: order.id,
      total: order.totalAmount,
      state: session.state,
      recovery: session.recovery ?? null,
    };
  }
}