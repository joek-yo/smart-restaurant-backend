// FILE: src/domains/sessions/use-cases/add-to-cart.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';

@Injectable()
export class AddToCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string, item: CartItemEntity): Promise<void> {
    await this.sessionService.addItem(userId, item);
  }
}