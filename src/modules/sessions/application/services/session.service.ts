// FILE: src/modules/sessions/application/services/session.service.ts

import { Injectable, Inject } from '@nestjs/common';

import { SessionEntity } from '../../domain/entities/session.entity';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';

import { SessionRepository } from '../../domain/repositories/session.repository';
import { CartItemRepository } from '../../domain/repositories/cart-item.repository';
import { SessionCacheRepository } from '../../domain/repositories/session-cache.repository';

@Injectable()
export class SessionService {
  constructor(
    @Inject(SessionRepository)
    private readonly sessionRepo: SessionRepository,

    @Inject(CartItemRepository)
    private readonly cartRepo: CartItemRepository,

    @Inject(SessionCacheRepository)
    private readonly cacheRepo: SessionCacheRepository,
  ) {}

  // ==================================================
  // 🧠 SESSION CREATION / FETCH
  // ==================================================

  async getOrCreate(
    userId: string,
    tenantId: string,
    branchId?: string,
  ): Promise<SessionEntity> {
    const match = await this.sessionRepo.findActiveByUser({ tenantId, userId, branchId });

    if (match) {
      return this.hydrate(match);
    }

    const session = new SessionEntity({
      id: undefined,
      businessId: tenantId,
      branchId,
      userId,
    });

    const saved = await this.sessionRepo.save(session);
    await this.cacheRepo.set(saved);

    return saved;
  }

  async getById(sessionId: string): Promise<SessionEntity | null> {
    const cached = await this.cacheRepo.getBySessionId(sessionId);
    if (cached) return cached;

    const session = await this.sessionRepo.findById(sessionId);
    if (!session) return null;

    await this.cacheRepo.set(session);
    return session;
  }

  // ==================================================
  // 🛒 CART OPERATIONS (ONLY SOURCE OF TRUTH)
  // ==================================================

  async addItem(sessionId: string, item: CartItemEntity): Promise<SessionEntity> {
    const session = await this.getOrFail(sessionId);

    session.addItem(item);

    await this.sessionRepo.update(sessionId, session);
    await this.cacheRepo.set(session);

    return session;
  }

  async removeItem(sessionId: string, productId: string): Promise<SessionEntity> {
    const session = await this.getOrFail(sessionId);

    session.removeItem(productId);

    await this.sessionRepo.update(sessionId, session);
    await this.cacheRepo.set(session);

    return session;
  }

  async updateQuantity(
    sessionId: string,
    productId: string,
    quantity: number,
  ): Promise<SessionEntity> {
    const session = await this.getOrFail(sessionId);

    session.updateQuantity(productId, quantity);

    await this.sessionRepo.update(sessionId, session);
    await this.cacheRepo.set(session);

    return session;
  }

  async clear(sessionId: string): Promise<SessionEntity> {
    const session = await this.getOrFail(sessionId);

    session.clearCart();

    await this.sessionRepo.update(sessionId, session);
    await this.cacheRepo.set(session);

    return session;
  }

  // ==================================================
  // 🔄 SESSION STATE OPERATIONS
  // ==================================================

  async startCheckout(sessionId: string): Promise<SessionEntity> {
    const session = await this.getOrFail(sessionId);

    session.checkoutStart();

    await this.sessionRepo.update(sessionId, session);
    await this.cacheRepo.set(session);

    return session;
  }

  // ==================================================
  // 📦 SNAPSHOT (USED BY CHECKOUT ONLY)
  // ==================================================

  async getSnapshot(sessionId: string): Promise<SessionEntity> {
    const session = await this.getOrFail(sessionId);
    return session.toSnapshot();
  }

  // ==================================================
  // 🧠 INTERNAL HELPERS
  // ==================================================

  private async getOrFail(sessionId: string): Promise<SessionEntity> {
    const session = await this.getById(sessionId);

    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    return session;
  }

  private async hydrate(session: SessionEntity): Promise<SessionEntity> {
    // Load cart items if needed (future DB optimization hook)
    const items = await this.cartRepo.findBySession(session.id!);

    session.items = items;
    return session;
  }
}