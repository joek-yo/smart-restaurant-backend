// FILE: src/modules/sessions/application/use-cases/remove-from-cart.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  async execute(userId: string, productId: string): Promise<void> {
    // ⚠️ SessionService is now PURE STORAGE
    // So we retrieve → mutate outside → save back

    const session = await this.sessionService.getOrCreate(userId);

    session.removeItem(productId);

    await this.sessionService.save(session);
  }
}