// src/modules/checkout/application/use-cases/add-item-to-cart.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '@modules/sessions/application/services/session.service';
import { CartItemEntity } from '@modules/sessions/domain/entities/cart-item.entity';

/**
 * AddItemToCartUseCase
 * ---------------------
 * Handles adding items into cart session.
 */

@Injectable()
export class AddItemToCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(input: {
    userId: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }) {
    const session = await this.sessionService.getOrCreate(input.userId);

    const item = new CartItemEntity({
      productId: input.productId,
      name: input.name,
      price: input.price,
      quantity: input.quantity,
      sessionId: session.id!,
      businessId: session.businessId,
    });

    session.addItem(item);

    await this.sessionService.save(session);

    return session;
  }
}