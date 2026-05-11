// src/modules/checkout/application/use-cases/remove-item-from-cart.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class RemoveItemFromCartUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
  ) {}

  async execute(input: {
    userId: string;
    tenantId: string;
    branchId?: string;
    productId: string;
  }) {
    const session = await this.sessionPort.getOrCreate(
      input.userId,
      input.tenantId,
      input.branchId,
    );

    session.removeItem(input.productId);

    await this.sessionPort.save(session);

    return session;
  }
}