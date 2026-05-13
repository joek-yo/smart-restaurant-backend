import { Injectable, NotFoundException } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class UpdateQuantityUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(
    sessionId: string,
    productId: string,
    quantity: number,
  ): Promise<void> {
    const session = await this.sessionService.getById(sessionId);
    if (!session) throw new NotFoundException('Session not found');

    if (quantity <= 0) {
      await this.sessionService.removeItem(sessionId, productId);
    } else {
      await this.sessionService.updateQuantity(sessionId, productId, quantity);
    }
  }
}
