// src/modules/checkout/application/use-cases/add-item-to-cart.use-case.ts

import { Injectable, Inject } from '@nestjs/common';
import { CartItemEntity } from '@modules/sessions/domain/entities/cart-item.entity';
import { CheckoutSessionPort, CHECKOUT_SESSION_PORT } from '../ports/checkout-session.port';

@Injectable()
export class AddItemToCartUseCase {
  constructor(
    @Inject(CHECKOUT_SESSION_PORT)
    private readonly sessionPort: CheckoutSessionPort,
  ) {}

  async execute(input: {
    userId: string;
    tenantId: string;
    branchId?: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }) {
    const session = await this.sessionPort.getOrCreate(
      input.userId,
      input.tenantId,
      input.branchId,
    );

    const item = new CartItemEntity({
      productId: input.productId,
      name: input.name,
      price: input.price,
      quantity: input.quantity,
      sessionId: session.id!,
      businessId: session.businessId,
    });

    session.addItem(item);

    await this.sessionPort.save(session);

    return session;
  }
}