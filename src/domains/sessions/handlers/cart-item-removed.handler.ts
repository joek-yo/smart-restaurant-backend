// 📁 src/domains/sessions/handlers/cart-item-removed.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CartItemRemovedEvent } from '../events/cart-item-removed.event';
import { SessionRepository } from '../repositories/session.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';

@Injectable()
export class CartItemRemovedHandler {
  private readonly logger = new Logger(CartItemRemovedHandler.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cartItemRepo: CartItemRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly analytics: AnalyticsAdapter,
  ) {}

  /**
   * Reacts to CartItemRemovedEvent.
   * Updates session totals, cache, and triggers analytics.
   */
  @OnEvent('session.cart-item.removed', { async: true })
  async handle(event: CartItemRemovedEvent) {
    try {
      // Remove cart item from DB
      await this.cartItemRepo.delete(event.cartItem.id!);

      // Update session totals & lastUpdated
      const session = await this.sessionRepo.findById(event.sessionId);
      if (session) {
        session.items = session.items.filter(i => i.id !== event.cartItem.id);
        session.calculateTotal();
        session.touch();
        await this.sessionRepo.update(session.id!, session);
      }

      // Update cache
      await this.cacheRepo.set(event.userId, session);

      // Analytics
      await this.analytics.trackCartItemRemoved(event);

      this.logger.log(`CartItemRemoved handled for session ${event.sessionId}`);
    } catch (err) {
      this.logger.error(
        `Error handling CartItemRemovedEvent for session ${event.sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}