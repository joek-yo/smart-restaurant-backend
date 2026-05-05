// 📁 src/domains/sessions/services/session.service.ts

import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../interfaces/session-repository.interface'; // Ensure interface is used for typing
import { SessionEntity } from '../entities/session.entity';
import { CartItemEntity } from '../entities/cart-item.entity';
import { SessionState } from '../value-objects/session-state.vo';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepository,
  ) {}

  private getSessionScope() {
    return {
      businessId: 'default',
      branchId: 'default',
    };
  }

  // ==================================================
  // GET OR CREATE SESSION
  // ==================================================
  async getOrCreate(userId: string): Promise<SessionEntity> {
    const { businessId, branchId } = this.getSessionScope();

    // ✅ FIXED: Using the new findByUserId method
    const sessions = await this.sessionRepo.findByUserId(userId);

    let session = sessions.find((s) =>
      s.businessId === businessId &&
      s.branchId === branchId &&
      s.state.value !== SessionState.CHECKOUT,
    );

    if (session) {
      return session;
    }

    session = new SessionEntity({
      userId,
      businessId,
      branchId,
      items: [],
    });

    // Note: If your repo uses 'save', use this.sessionRepo.save(session)
    return await this.sessionRepo.save(session);
  }

  // ==================================================
  // ADD ITEM
  // ==================================================
  async addItem(userId: string, item: CartItemEntity): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.addItem(item);

    // ✅ FIXED: Passing ID and Partial object
    return this.sessionRepo.update(session.id, {
      items: session.items,
    });
  }

  // ==================================================
  // REMOVE ITEM
  // ==================================================
  async removeItem(userId: string, productId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.removeItem(productId);

    return this.sessionRepo.update(session.id, {
      items: session.items,
    });
  }

  // ==================================================
  // UPDATE QUANTITY
  // ==================================================
  async updateQuantity(userId: string, productId: string, quantity: number): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.updateQuantity(productId, quantity);

    return this.sessionRepo.update(session.id, {
      items: session.items,
    });
  }

  // ==================================================
  // CHECKOUT
  // ==================================================
  async checkout(userId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.checkout();

    return this.sessionRepo.update(session.id, {
      state: session.state,
    });
  }

  // ==================================================
  // RESET
  // ==================================================
  async reset(userId: string): Promise<SessionEntity> {
    const session = await this.getOrCreate(userId);
    session.reset();

    return this.sessionRepo.update(session.id, {
      items: [],
      state: session.state,
    });
  }

  // ==================================================
  // GET SESSION (READ ONLY)
  // ==================================================
  async getSession(userId: string): Promise<SessionEntity | null> {
    const { businessId, branchId } = this.getSessionScope();
    const sessions = await this.sessionRepo.findByUserId(userId);

    return (
      sessions.find((s) =>
        s.businessId === businessId &&
        s.branchId === branchId &&
        s.state.value !== SessionState.CHECKOUT,
      ) || null
    );
  }
}