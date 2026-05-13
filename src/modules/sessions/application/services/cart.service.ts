// FILE: src/modules/sessions/application/services/cart.service.ts

import { Injectable } from '@nestjs/common';

import { SessionService } from './session.service';
import { CartItemEntity } from '../../domain/entities/cart-item.entity';
import { SessionEntity } from '../../domain/entities/session.entity';

@Injectable()
export class CartService {
  constructor(
    private readonly sessionService: SessionService,
  ) {}

  // ==================================================
  // 🛒 ADD ITEM
  // ==================================================

  async addItem(
    sessionId: string,
    item: CartItemEntity,
  ): Promise<SessionEntity> {
    this.validateItem(item);

    const session = await this.sessionService.addItem(sessionId, item);

    return this.afterCartMutation(session);
  }

  // ==================================================
  // 🗑 REMOVE ITEM
  // ==================================================

  async removeItem(
    sessionId: string,
    productId: string,
  ): Promise<SessionEntity> {
    const session = await this.sessionService.removeItem(
      sessionId,
      productId,
    );

    return this.afterCartMutation(session);
  }

  // ==================================================
  // 🔢 UPDATE QUANTITY
  // ==================================================

  async updateQuantity(
    sessionId: string,
    productId: string,
    quantity: number,
  ): Promise<SessionEntity> {
    this.validateQuantity(quantity);

    const session = await this.sessionService.updateQuantity(
      sessionId,
      productId,
      quantity,
    );

    return this.afterCartMutation(session);
  }

  // ==================================================
  // 🧹 CLEAR CART
  // ==================================================

  async clear(sessionId: string): Promise<SessionEntity> {
    const session = await this.sessionService.clear(sessionId);

    return this.afterCartMutation(session);
  }

  // ==================================================
  // 📦 CART INSPECTION
  // ==================================================

  async getCart(sessionId: string): Promise<CartItemEntity[]> {
    const session = await this.sessionService.getById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return session.items;
  }

  // ==================================================
  // 🧠 CART RULES (DOMAIN GUARD LAYER)
  // ==================================================

  private validateItem(item: CartItemEntity): void {
    if (!item.productId) {
      throw new Error('Cart item must have productId');
    }

    if (item.quantity <= 0) {
      throw new Error('Cart item quantity must be greater than 0');
    }

    if (item.price < 0) {
      throw new Error('Cart item price cannot be negative');
    }
  }

  private validateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    if (quantity > 1000) {
      throw new Error('Quantity exceeds allowed limit');
    }
  }

  // ==================================================
  // 🔄 POST-MUTATION HOOK
  // ==================================================

  private async afterCartMutation(
    session: SessionEntity,
  ): Promise<SessionEntity> {
    // Future hooks:
    // - analytics tracking
    // - cart abandonment timer reset
    // - pricing recalculation hooks

    return session;
  }
}