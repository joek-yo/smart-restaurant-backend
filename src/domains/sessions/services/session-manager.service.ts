// FILE: src/domains/sessions/services/session-manager.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { SessionRepository } from '../repositories/session.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';
import { SessionCacheRepository } from '../repositories/session-cache.repository';

import { SessionEntity } from '../entities/session.entity';
import { CartItemEntity } from '../entities/cart-item.entity';
import { CartItemVO } from '../value-objects/cart-item.vo';

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

  // =========================
  // SESSION GET OR CREATE
  // =========================
  async getOrCreateSession(userId: string): Promise<SessionEntity> {
    const cached = await this.cacheRepo.get(userId);
    if (cached) return cached;

    let session = await this.sessionRepo.findActiveByUser(userId);

    if (!session) {
      session = new SessionEntity({
        userId,
        items: [],
      });

      const created = await this.sessionRepo.create(session);

      if (!created) {
        throw new Error('Session creation failed');
      }

      session = created;
    }

    await this.cacheRepo.set(session);

    return session;
  }

  // =========================
  // ADD TO CART
  // =========================
  async addToCart(userId: string, item: CartItemEntity): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    this.eventEmitter.emit(
      'session.cart-item.added',
      new CartItemAddedEvent(
        session.id!,
        userId,
        this.toVO(item),
        session.state,
      ),
    );
  }

  // =========================
  // REMOVE ITEM
  // =========================
  async removeFromCart(userId: string, item: CartItemEntity): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    this.eventEmitter.emit(
      'session.cart-item.removed',
      new CartItemRemovedEvent(
        session.id!,
        userId,
        this.toVO(item),
        session.state,
      ),
    );
  }

  // =========================
  // UPDATE QUANTITY
  // =========================
  async updateQuantity(
    userId: string,
    item: CartItemEntity,
    newQuantity: number,
  ): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    this.eventEmitter.emit(
      'session.cart-item.quantity-updated',
      new QuantityUpdatedEvent(
        session.id!,
        userId,
        this.toVO(item),
        item.quantity,
        newQuantity,
        session.state, // ✅ FIXED
      ),
    );
  }

  // =========================
  // CHECKOUT
  // =========================
  async checkout(userId: string): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    if (!session.items || session.items.length === 0) {
      throw new Error('Cannot checkout empty cart');
    }

    this.eventEmitter.emit(
      'session.checked-out',
      new SessionCheckedOutEvent(
        session.id!,
        userId,
        session.items.map((i) => this.toVO(i)),
        session.totalAmount,
      ),
    );
  }

  // =========================
  // RESET SESSION
  // =========================
  async resetSession(userId: string): Promise<void> {
    const session = await this.getOrCreateSession(userId);

    await this.cartItemRepo.deleteBySession(session.id!);

    session.items = [];
    session.touch?.();

    await this.sessionRepo.update(session.id!, session);
    await this.cacheRepo.set(session);

    this.logger.log(`Session reset for user ${userId}`);
  }

  // =========================
  // ENTITY → VO
  // =========================
  private toVO(item: CartItemEntity): CartItemVO {
    return new CartItemVO({
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      options: (item as any).options ?? {},
    });
  }
}