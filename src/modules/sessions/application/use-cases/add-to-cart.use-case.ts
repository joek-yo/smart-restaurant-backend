import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';

@Injectable()
export class AddToCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string, item: CartItemEntity, tenantId: string, branchId?: string): Promise<void> {
    const session = await this.sessionService.getOrCreate(userId, tenantId, branchId);
    session.addItem(item);
    await this.sessionService.update(session.id!, {
      items: session.items,
      state: session.state,
    });
  }
}
