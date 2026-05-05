// FILE: src/domains/sessions/repositories/cart-item.repository.ts

import { Injectable } from '@nestjs/common';
import { CartItemEntity } from '../entities/cart-item.entity';
import { v4 as uuidv4 } from 'uuid';

// ========================
// ABSTRACT CONTRACT
// ========================

export abstract class CartItemRepository {
  abstract add(item: CartItemEntity): Promise<CartItemEntity>;

  abstract update(item: CartItemEntity): Promise<CartItemEntity>;

  abstract delete(id: string): Promise<void>;

  abstract findBySession(sessionId: string): Promise<CartItemEntity[]>;

  // ✅ REQUIRED BY SERVICE (FIX)
  abstract deleteBySession(sessionId: string): Promise<void>;
}

// ========================
// IN-MEMORY IMPLEMENTATION
// ========================

@Injectable()
export class InMemoryCartItemRepository extends CartItemRepository {
  private cartItems: Map<string, CartItemEntity> = new Map();

  async add(item: CartItemEntity): Promise<CartItemEntity> {
    if (!item.id) {
      item.id = uuidv4();
    }

    item.createdAt = new Date();
    item.updatedAt = new Date();

    this.cartItems.set(item.id, item);
    return item;
  }

  async update(item: CartItemEntity): Promise<CartItemEntity> {
    const existing = this.cartItems.get(item.id!);

    if (!existing) {
      throw new Error(`CartItem ${item.id} not found`);
    }

    const updated: CartItemEntity = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      item,
      { updatedAt: new Date() },
    );

    this.cartItems.set(updated.id!, updated);
    return updated;
  }

  async findBySession(sessionId: string): Promise<CartItemEntity[]> {
    return Array.from(this.cartItems.values()).filter(
      (item) => item.sessionId === sessionId,
    );
  }

  async delete(id: string): Promise<void> {
    this.cartItems.delete(id);
  }

  // ✅ IMPLEMENTATION (FIX)
  async deleteBySession(sessionId: string): Promise<void> {
    const items = await this.findBySession(sessionId);

    items.forEach((item) => {
      if (item.id) {
        this.cartItems.delete(item.id);
      }
    });
  }
}