// src/modules/checkout/application/use-cases/update-cart-quantity.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class UpdateCartQuantityUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
  ) {}

  async execute(input: {
    userId: string;
    tenantId: string;
    branchId?: string;
    productId: string;
    quantity: number;
  }) {
    const session = await this.sessionPort.getOrCreate(
      input.userId,
      input.tenantId,
      input.branchId,
    );

    session.updateQuantity(input.productId, input.quantity);

    await this.sessionPort.save(session);

    return session;
  }
}