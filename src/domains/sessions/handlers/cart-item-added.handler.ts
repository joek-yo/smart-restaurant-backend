// 📁 src/domains/sessions/handlers/cart-item-added.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CartItemAddedEvent } from '../events/cart-item-added.event';
import { SessionRepository } from '../repositories/session.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';
import { AbandonedCartQueue } from '../queues/abandoned-cart-queue';

@Injectable()
export class CartItemAddedHandler {
  private readonly logger = new Logger(CartItemAddedHandler.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cartItemRepo: CartItemRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly analytics: AnalyticsAdapter,
    private readonly abandonedQueue: AbandonedCartQueue,
  ) {}

  /**
   * Reacts to CartItemAddedEvent.
   * Updates session totals, cache, triggers analytics, and sets abandoned-cart timer.
   */
  @OnEvent('session.cart-item.added', { async: true })
  async handle(event: CartItemAddedEvent) {
    try {
      // Persist cart item
      await this.cartItemRepo.create(event.cartItem);

      // Update session totals & lastUpdated
      const session = await this.sessionRepo.findById(event.sessionId);
      if (session) {
        session.items.push(event.cartItem);
        session.calculateTotal();
        session.touch();
        await this.sessionRepo.update(session.id!, session);
      }

      // Update cache for quick retrieval
      await this.cacheRepo.set(event.userId, session);

      // Send analytics event
      await this.analytics.trackCartItemAdded(event);

      // Trigger abandoned cart workflow
      await this.abandonedQueue.schedule(event.sessionId);

      this.logger.log(`CartItemAdded handled for session ${event.sessionId}`);
    } catch (err) {
      this.logger.error(
        `Error handling CartItemAddedEvent for session ${event.sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}