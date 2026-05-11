import { Injectable } from '@nestjs/common';
import { SessionService } from '../services/session.service';

@Injectable()
export class RemoveFromCartUseCase {
  constructor(private readonly sessionService: SessionService) {}

  async execute(userId: string, productId: string, tenantId: string, branchId?: string): Promise<void> {
    const session = await this.sessionService.getOrCreate(userId, tenantId, branchId);
    session.removeItem(productId);
    await this.sessionService.save(session);
  }
}
