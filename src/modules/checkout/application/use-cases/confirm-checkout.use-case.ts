// src/modules/checkout/application/use-cases/confirm-checkout.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';
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

    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot confirm checkout with empty cart');
    }

    session.checkout();

    await this.sessionPort.save(session);

    const order = await this.createOrder.execute(session);

    return {
      success: true,
      orderId: order.id,
      total: order.totalAmount,
    };
  }
}