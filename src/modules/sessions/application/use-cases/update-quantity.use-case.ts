// FILE: src/modules/sessions/application/use-cases/update-quantity.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class UpdateQuantityUseCase {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  async execute(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    const session = await this.sessionService.getSession(userId);
    if (!session) throw new NotFoundException('Session not found');

    const item = session.items.find((i) => i.productId === productId);
    if (!item) throw new NotFoundException('Item not found in cart');

    if (quantity <= 0) {
      session.items = session.items.filter((i) => i.productId !== productId);
    } else {
      item.quantity = quantity;
    }

    await this.sessionService.save(session);
  }
}