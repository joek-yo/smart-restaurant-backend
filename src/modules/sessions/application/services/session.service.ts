// src/modules/sessions/application/services/session.service.ts

import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { SessionEntity } from '../../domain/entities/session.entity';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import { SessionState } from '../../domain/value-objects/session-state.vo';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepository,
  ) {}

  private getSessionScope() {
    return { businessId: 'default', branchId: 'default' };
  }

  async getOrCreate(userId: string): Promise<SessionEntity> {
    const { businessId, branchId } = this.getSessionScope();
    const sessions = await this.sessionRepo.findByUserId(userId);

    let session = sessions.find((s: SessionEntity) =>
      s.businessId === businessId &&
      s.branchId === branchId &&
      s.state.value !== SessionState.CHECKOUT,
    );

    if (session) return session;

    session = new SessionEntity({ userId, businessId, branchId, items: [] });
    return this.sessionRepo.save(session);
  }

  async addItem(userId: string, item: CartItemEntity): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.addItem(item);
    return this.sessionRepo.update(session.id!, { items: session.items });
  }

  async removeItem(userId: string, productId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.removeItem(productId);
    return this.sessionRepo.update(session.id!, { items: session.items });
  }

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.updateQuantity(productId, quantity);
    return this.sessionRepo.update(session.id!, { items: session.items });
  }

  async checkout(userId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.checkout();
    return this.sessionRepo.update(session.id!, { state: session.state });
  }

  async reset(userId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.reset();
    return this.sessionRepo.update(session.id!, { items: [], state: session.state });
  }

  async getSession(userId: string): Promise<SessionEntity | null> {
    const { businessId, branchId } = this.getSessionScope();
    const sessions = await this.sessionRepo.findByUserId(userId);
    return sessions.find((s: SessionEntity) =>
      s.businessId === businessId &&
      s.branchId === branchId &&
      s.state.value !== SessionState.CHECKOUT,
    ) || null;
  }
}
