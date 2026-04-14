// FILE: src/domains/sessions/use-cases/remove-from-cart.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionManagerService } from '../services/session-manager.service';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(
    private readonly sessionManager: SessionManagerService,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    await this.sessionManager.removeFromCart(userId, productId);
  }
}