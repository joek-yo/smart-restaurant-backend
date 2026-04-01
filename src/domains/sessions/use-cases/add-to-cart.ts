// src/modules/sessions/use-cases/add-to-cart.ts

import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions.service';
import { ProductSnapshot } from '../cart.service';

@Injectable()
export class AddToCartUseCase {
  constructor(private readonly sessionsService: SessionsService) {}

  execute(phone: string, product: ProductSnapshot, quantity = 1) {
    const session = this.sessionsService.getSession(phone);

    // Add to cart via service
    this.sessionsService.addToCart(phone, product, quantity);

    // Move flow forward
    this.sessionsService.setStep(phone, 'checkout');

    return {
      message: 'Item added to cart',
      cart: session.cart,
    };
  }
}