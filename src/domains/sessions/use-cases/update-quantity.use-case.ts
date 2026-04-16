// FILE: src/domains/sessions/use-cases/update-quantity.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class UpdateQuantityUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string, productId: string, quantity: number): Promise<void> {
    await this.sessionService.updateQuantity(userId, productId, quantity);
  }
}