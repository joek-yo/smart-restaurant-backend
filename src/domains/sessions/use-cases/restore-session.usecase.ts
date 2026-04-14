// 📁 src/domains/sessions/use-cases/restore-session.usecase.ts

import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';
import { SessionEntity } from '../entities/session.entity';
import { EventBus } from '@nestjs/cqrs';
import { SessionRecoveredEvent } from '../events/session-recovered.event';

@Injectable()
export class RestoreSessionUseCase {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cartItemRepo: CartItemRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Restore a session from DB or cache, e.g., after a crash or system failure
   */
  async execute(userId: string): Promise<SessionEntity | null> {
    // 1️⃣ Attempt to fetch active session from cache
    const cachedSessions = await this.cacheRepo.get(userId);
    if (cachedSessions) {
      return cachedSessions;
    }

    // 2️⃣ Fallback to DB
    const session = await this.sessionRepo.findActiveByUser(userId);
    if (!session) return null;

    // 3️⃣ Rehydrate cart items
    session.items = await this.cartItemRepo.findBySession(session.id!);

    // 4️⃣ Update cache
    await this.cacheRepo.set(session.id!, session);

    // 5️⃣ Publish event
    this.eventBus.publish(new SessionRecoveredEvent(session.id!));

    return session;
  }
}