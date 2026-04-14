// FILE: src/domains/sessions/use-cases/checkout.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionManagerService } from '../services/session-manager.service';

@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly sessionManager: SessionManagerService,
  ) {}

  async execute(userId: string): Promise<void> {
    await this.sessionManager.checkout(userId);
  }
}