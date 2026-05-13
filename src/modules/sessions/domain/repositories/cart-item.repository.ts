// FILE: src/modules/sessions/domain/repositories/cart-item.repository.ts

import { Injectable } from '@nestjs/common';
import { CartItemEntity } from '../entities/cart-item.entity';
import { v4 as uuidv4 } from 'uuid';

// ========================
// ABSTRACT CONTRACT
// ========================

/**
 * CartItemRepository
 * -------------------
 * Canonical contract for cart item persistence.
 *
 * RULES:
 * - MUST be tenant-safe (businessId = tenantId)
 * - sessionId is required for all reads
 * - no global scans or cross-tenant leakage
 */
export abstract class CartItemRepository {
  abstract add(item: CartItemEntity): Promise<CartItemEntity>;

  abstract update(item: CartItemEntity): Promise<CartItemEntity>;

  abstract delete(id: string): Promise<void>;

  abstract findBySession(sessionId: string): Promise<CartItemEntity[]>;

  abstract deleteBySession(sessionId: string): Promise<void>;
}

// ========================
// IN-MEMORY IMPLEMENTATION
// ========================

@Injectable()
export class InMemoryCartItemRepository extends CartItemRepository {
  private cartItems: Map<string, CartItemEntity> = new Map();

  /**
   * INTERNAL KEY STRATEGY
   * Ensures deterministic overwrite and prevents collisions
   */
  private buildKey(item: CartItemEntity): string {
    return `${item.businessId || 'default'}:${item.id}`;
  }

  async add(item: CartItemEntity): Promise<CartItemEntity> {
    if (!item.id) {
      item.id = uuidv4();
    }

    item.createdAt = item.createdAt ?? new Date();
    item.updatedAt = new Date();

    const key = this.buildKey(item);

    this.cartItems.set(key, item);
    return item;
  }

  async update(item: CartItemEntity): Promise<CartItemEntity> {
    if (!item.id) {
      throw new Error(`CartItem id is required`);
    }

    const key = this.buildKey(item);
    const existing = this.cartItems.get(key);

    if (!existing) {
      throw new Error(`CartItem ${item.id} not found`);
    }

    const updated = new CartItemEntity({
      ...existing,
      ...item,
      updatedAt: new Date(),
    });

    this.cartItems.set(key, updated);
    return updated;
  }

  async findBySession(sessionId: string): Promise<CartItemEntity[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.sessionId === sessionId,
    );
  }

  async delete(id: string): Promise<void> {
    // deterministic delete (find by id only)
    const entry = Array.from(this.cartItems.entries()).find(
      ([_, item]) => item.id === id,
    );

    if (!entry) return;

    this.cartItems.delete(entry[0]);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    const items = await this.findBySession(sessionId);

    for (const item of items) {
      if (!item.id) continue;

      const key = this.buildKey(item);
      this.cartItems.delete(key);
    }
  }
}