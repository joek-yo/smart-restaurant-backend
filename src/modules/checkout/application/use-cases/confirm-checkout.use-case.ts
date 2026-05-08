// src/modules/checkout/application/use-cases/confirm-checkout.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';
import { CreateOrderFromCheckoutUseCase } from './create-order-from-checkout.use-case';

/**
 * ConfirmCheckoutUseCase
 * -----------------------
 * FINAL USER CONFIRMATION STEP BEFORE ORDER CREATION
 */

@Injectable()
export class ConfirmCheckoutUseCase {
  constructor(
    private readonly sessionService: SessionService,
    private readonly createOrder: CreateOrderFromCheckoutUseCase,
  ) {}

  async execute(input: { userId: string }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    // Safety guard
    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot confirm checkout with empty cart');
    }

    // Ensure checkout state
    session.checkout();

    await this.sessionService.save(session);

    // 🔥 TRIGGER ORDER CREATION
    const order = await this.createOrder.execute(session);

    return {
      success: true,
      orderId: order.id,
      total: order.totalAmount,
    };
  }
}