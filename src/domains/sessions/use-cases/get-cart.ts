// src/modules/sessions/use-cases/get-cart.ts

import { Injectable } from '@nestjs/common';
import { SessionsService } from '../sessions.service';

@Injectable()
export class GetCartUseCase {
  constructor(private readonly sessionsService: SessionsService) {}

  execute(phone: string) {
    const cart = this.sessionsService.getCart(phone);

    return {
      items: cart,
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0), // ✅ fixed
    };
  }
}