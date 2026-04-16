// FILE: src/domains/sessions/use-cases/remove-from-cart.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string, productId: string): Promise<void> {
    await this.sessionService.removeItem(userId, productId);
  }
}