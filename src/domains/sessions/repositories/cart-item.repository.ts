// FILE: src/domains/sessions/repositories/cart-item.repository.ts

import { Injectable } from '@nestjs/common';
import { CartItemEntity } from '../entities/cart-item.entity';
import { v4 as uuidv4 } from 'uuid';

// Abstract contract (DI token)
export abstract class CartItemRepository {
  abstract create(cartItem: CartItemEntity): Promise<CartItemEntity>;

  abstract update(
    id: string,
    partial: Partial<CartItemEntity>,
  ): Promise<CartItemEntity>;

  abstract findById(id: string): Promise<CartItemEntity | null>;

  abstract findBySession(sessionId: string): Promise<CartItemEntity[]>;

  abstract delete(id: string): Promise<void>;

  abstract deleteBySession(sessionId: string): Promise<void>;
}

@Injectable()
export class InMemoryCartItemRepository extends CartItemRepository {
  private cartItems: Map<string, CartItemEntity> = new Map();

  async create(cartItem: CartItemEntity): Promise<CartItemEntity> {
    if (!cartItem.id) {
      cartItem.id = uuidv4();
    }

    cartItem.createdAt = new Date();
    cartItem.updatedAt = new Date();

    this.cartItems.set(cartItem.id, cartItem);
    return cartItem;
  }

  async update(
    id: string,
    partial: Partial<CartItemEntity>,
  ): Promise<CartItemEntity> {
    const existing = this.cartItems.get(id);

    if (!existing) {
      throw new Error(`CartItem ${id} not found`);
    }

    const updated = Object.assign(
      Object.create(Object.getPrototypeOf(existing)),
      existing,
      partial,
      { updatedAt: new Date() },
    ) as CartItemEntity;

    this.cartItems.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<CartItemEntity | null> {
    return this.cartItems.get(id) || null;
  }

  async findBySession(sessionId: string): Promise<CartItemEntity[]> {
    // ⚠️ Phase 1 safe assumption: sessionId is NOT stored in entity
    // So we return all items (temporary stabilization behavior)
    return Array.from(this.cartItems.values());
  }

  async delete(id: string): Promise<void> {
    this.cartItems.delete(id);
  }

  async deleteBySession(sessionId: string): Promise<void> {
    // ⚠️ Phase 1 safe behavior: clear all (temporary)
    this.cartItems.clear();
  }
}