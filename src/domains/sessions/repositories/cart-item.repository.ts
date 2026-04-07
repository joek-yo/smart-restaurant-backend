// 📁 src/domains/sessions/repositories/cart-item.repository.ts

import { Injectable } from '@nestjs/common';
import { CartItem } from '../entities/cart-item.entity';
import { v4 as uuidv4 } from 'uuid';

// Interface defining the repository contract
export interface CartItemRepository {
  create(cartItem: CartItem): Promise<CartItem>;
  update(id: string, partial: Partial<CartItem>): Promise<CartItem>;
  findById(id: string): Promise<CartItem | null>;
  findBySession(sessionId: string, businessId?: string, branchId?: string): Promise<CartItem[]>;
  delete(id: string): Promise<void>;
  deleteBySession(sessionId: string, businessId?: string, branchId?: string): Promise<void>;
}

@Injectable()
export class InMemoryCartItemRepository implements CartItemRepository {
  private cartItems: Map<string, CartItem> = new Map();

  async create(cartItem: CartItem): Promise<CartItem> {
    if (!cartItem.id) {
      cartItem.id = uuidv4();
    }
    cartItem.createdAt = new Date();
    cartItem.updatedAt = new Date();
    this.cartItems.set(cartItem.id, cartItem);
    return cartItem;
  }

  async update(id: string, partial: Partial<CartItem>): Promise<CartItem> {
    const existing = this.cartItems.get(id);
    if (!existing) throw new Error(`CartItem ${id} not found`);
    const updated = { ...existing, ...partial, updatedAt: new Date() };
    this.cartItems.set(id, updated);
    return updated;
  }

  async findById(id: string): Promise<CartItem | null> {
    return this.cartItems.get(id) || null;
  }

  async findBySession(sessionId: string, businessId?: string, branchId?: string): Promise<CartItem[]> {
    return Array.from(this.cartItems.values()).filter(item => 
      item.sessionId === sessionId &&
      (!businessId || item.businessId === businessId) &&
      (!branchId || item.branchId === branchId)
    );
  }

  async delete(id: string): Promise<void> {
    this.cartItems.delete(id);
  }

  async deleteBySession(sessionId: string, businessId?: string, branchId?: string): Promise<void> {
    for (const [id, item] of this.cartItems.entries()) {
      if (
        item.sessionId === sessionId &&
        (!businessId || item.businessId === businessId) &&
        (!branchId || item.branchId === branchId)
      ) {
        this.cartItems.delete(id);
      }
    }
  }
}