// 📁 src/domains/sessions/services/cart-recovery.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { SessionRepository } from '../repositories/session.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';

import { Session } from '../entities/session.entity';

// 🟢 DOMAIN EVENTS
import { SessionExpiredEvent } from '../events/session-expired.event';
import { AbandonedCartTriggeredEvent } from '../events/abandoned-cart-triggered.event';

// 🟢 EVENT BUS
import { EventBus } from '../../../common/events/event-bus';

@Injectable()
export class CartRecoveryService {
  private readonly logger = new Logger(CartRecoveryService.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly eventBus: EventBus,
  ) {}

  /* =====================================================
     RESTORE SESSION
  ===================================================== */

  async restoreSession(userId: string): Promise<Session | null> {
    try {
      const session = await this.sessionRepo.findActiveByUser(userId);

      if (!session) {
        this.logger.warn(`No active session found for user ${userId}`);
        return null;
      }

      await this.cacheRepo.set(userId, session);

      this.logger.log(`Session restored for user ${userId}`);

      return session;
    } catch (err) {
      this.logger.error(
        `Failed to restore session for user ${userId}`,
        err as any,
      );
      throw err;
    }
  }

  /* =====================================================
     EXPIRE SESSION
  ===================================================== */

  async expireSession(sessionId: string, userId: string): Promise<void> {
    try {
      this.eventBus.publish(
        new SessionExpiredEvent(sessionId, userId),
      );

      this.logger.log(`Session expiry triggered for ${sessionId}`);
    } catch (err) {
      this.logger.error(
        `Failed to expire session ${sessionId}`,
        err as any,
      );
      throw err;
    }
  }

  /* =====================================================
     ABANDONED CART FLOW
  ===================================================== */

  async triggerAbandonedCart(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.sessionRepo.findById(sessionId);

      if (!session?.items?.length) {
        this.logger.warn(`No cart to recover for session ${sessionId}`);
        return;
      }

      const cartItems = session.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      this.eventBus.publish(
        new AbandonedCartTriggeredEvent(
          sessionId,
          userId,
          cartItems,
        ),
      );

      this.logger.log(`Abandoned cart triggered for session ${sessionId}`);
    } catch (err) {
      this.logger.error(
        `Failed abandoned cart trigger for session ${sessionId}`,
        err as any,
      );
      throw err;
    }
  }

  /* =====================================================
     RECOVERY RETRY
  ===================================================== */

  async retryRecovery(sessionId: string, userId: string): Promise<void> {
    try {
      const session = await this.sessionRepo.findById(sessionId);

      if (!session) {
        this.logger.warn(`Retry failed: session ${sessionId} not found`);
        return;
      }

      const cached = await this.cacheRepo.get(userId);

      if (!cached) {
        await this.cacheRepo.set(userId, session);
      }

      if (session.items?.length > 0) {
        await this.triggerAbandonedCart(sessionId, userId);
      }

      this.logger.log(`Recovery retry completed for session ${sessionId}`);
    } catch (err) {
      this.logger.error(
        `Recovery retry failed for session ${sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}