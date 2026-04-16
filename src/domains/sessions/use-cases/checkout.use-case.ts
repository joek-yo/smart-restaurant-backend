// FILE: src/domains/sessions/use-cases/checkout.use-case.ts

import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class CheckoutUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string): Promise<void> {
    await this.sessionService.checkout(userId);
  }
}