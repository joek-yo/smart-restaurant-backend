// FILE: src/domains/sessions/use-cases/add-to-cart.use-case.ts

import { Injectable } from '@nestjs/common';

import { SessionManagerService } from '../services/session-manager.service';
import { CartItemEntity } from '../entities/cart-item.entity';

@Injectable()
export class AddToCartUseCase {
  constructor(
    private readonly sessionManager: SessionManagerService,
  ) {}

  async execute(userId: string, item: CartItemEntity): Promise<void> {
    await this.sessionManager.addToCart(userId, item);
  }
}