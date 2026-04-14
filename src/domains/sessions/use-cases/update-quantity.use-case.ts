// FILE: src/domains/sessions/use-cases/update-quantity.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionManagerService } from '../services/session-manager.service';

@Injectable()
export class UpdateQuantityUseCase {
  constructor(
    private readonly sessionManager: SessionManagerService,
  ) {}

  async execute(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    await this.sessionManager.updateQuantity(userId, productId, quantity);
  }
}