// 📁 src/domains/sessions/handlers/quantity-updated.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QuantityUpdatedEvent } from '../events/quantity-updated.event';
import { SessionRepository } from '../repositories/session.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';

@Injectable()
export class QuantityUpdatedHandler {
  private readonly logger = new Logger(QuantityUpdatedHandler.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cartItemRepo: CartItemRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly analytics: AnalyticsAdapter,
  ) {}

  @OnEvent('session.cart-item.quantity-updated', { async: true })
  async handle(event: QuantityUpdatedEvent) {
    try {
      // Update cart item in DB
      const cartItem = await this.cartItemRepo.update(event.cartItem.id!, {
        quantity: event.newQuantity,
      });

      // Update session totals
      const session = await this.sessionRepo.findById(event.sessionId);
      if (session) {
        const itemIndex = session.items.findIndex(i => i.id === event.cartItem.id);
        if (itemIndex !== -1) {
          session.items[itemIndex].quantity = event.newQuantity;
          session.items[itemIndex].total = cartItem.price * event.newQuantity;
          session.calculateTotal();
          session.touch();
          await this.sessionRepo.update(session.id!, session);
        }
      }

      // Update cache
      await this.cacheRepo.set(event.userId, session);

      // Analytics tracking
      await this.analytics.trackQuantityUpdated(event);

      this.logger.log(`QuantityUpdated handled for session ${event.sessionId}`);
    } catch (err) {
      this.logger.error(
        `Error handling QuantityUpdatedEvent for session ${event.sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}