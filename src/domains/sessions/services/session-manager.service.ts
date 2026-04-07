// 📁 src/domains/sessions/services/session-manager.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { SessionRepository } from '../repositories/session.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';

import { Session } from '../entities/session.entity';
import { CartItem } from '../entities/cart-item.entity';

import { CartItemAddedEvent } from '../events/cart-item-added.event';
import { CartItemRemovedEvent } from '../events/cart-item-removed.event';
import { QuantityUpdatedEvent } from '../events/quantity-updated.event';
import { SessionCheckedOutEvent } from '../events/session-checked-out.event';

@Injectable()
export class SessionManagerService {
  private readonly logger = new Logger(SessionManagerService.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly cartItemRepo: CartItemRepository,
    private readonly cacheRepo: SessionCacheRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get or create active session for user
   */
  async getOrCreateSession(userId: string): Promise<Session> {
    // 1. Try cache
    const cached = await this.cacheRepo.get(userId);
    if (cached) return cached;

    // 2. Try DB
    let session = await this.sessionRepo.findActiveByUser(userId);

    // 3. Create if not exists
    if (!session) {
      session = new Session({
        userId,
        status: 'ACTIVE',
        items: [],
      });

      session = await this.sessionRepo.create(session);
    }

    // 4. Cache it
    await this.cacheRepo.set(userId, session);

    return session;
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, item: CartItem): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    // Emit event (actual logic handled in handler)
    this.eventEmitter.emit(
      'session.cart-item.added',
      new CartItemAddedEvent(
        session.id!,
        userId,
        item as any, // VO later
        session.state as any,
      ),
    );
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, cartItem: CartItem): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    this.eventEmitter.emit(
      'session.cart-item.removed',
      new CartItemRemovedEvent(
        session.id!,
        userId,
        cartItem,
      ),
    );
  }

  /**
   * Update item quantity
   */
  async updateQuantity(
    userId: string,
    cartItem: CartItem,
    newQuantity: number,
  ): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    this.eventEmitter.emit(
      'session.cart-item.quantity-updated',
      new QuantityUpdatedEvent(
        session.id!,
        userId,
        cartItem,
        cartItem.quantity,
        newQuantity,
      ),
    );
  }

  /**
   * Checkout session
   */
  async checkout(userId: string): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    if (!session.items.length) {
      throw new Error('Cannot checkout empty cart');
    }

    this.eventEmitter.emit(
      'session.checked-out',
      new SessionCheckedOutEvent(
        session.id!,
        userId,
        session.items,
        session.totalAmount,
      ),
    );
  }

  /**
   * Reset session (clear cart)
   */
  async resetSession(userId: string): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    // Delete all cart items
    await this.cartItemRepo.deleteBySession(session.id!);

    // Reset session
    session.items = [];
    session.totalAmount = 0;
    session.touch();

    await this.sessionRepo.update(session.id!, session);
    await this.cacheRepo.set(userId, session);

    this.logger.log(`Session reset for user ${userId}`);
  }
}