/**
 * FILE: src/modules/checkout/domain/entities/cart.entity.ts
 *
 * 🛒 CART ENTITY (CORE AGGREGATE ROOT)
 * ------------------------------------
 * Owns all cart mutations:
 * - addItem
 * - removeItem
 * - updateQuantity
 * - calculate totals
 */

import { MoneyVO } from '../value-objects/money.vo';
import { CartTotalVO } from '../value-objects/cart-total.vo';

export interface CartItem {
  productId: string;
  name: string;
  quantity: number;
  price: MoneyVO;
}

export class CartEntity {
  private items: CartItem[] = [];

  constructor(initialItems: CartItem[] = []) {
    this.items = initialItems;
  }

  // =========================
  // MUTATIONS
  // =========================

  addItem(item: CartItem) {
    const existing = this.items.find(i => i.productId === item.productId);

    if (existing) {
      existing.quantity += item.quantity;
      return;
    }

    this.items.push(item);
  }

  removeItem(productId: string) {
    this.items = this.items.filter(i => i.productId !== productId);
  }

  updateQuantity(productId: string, quantity: number) {
    const item = this.items.find(i => i.productId === productId);

    if (!item) {
      throw new Error('Item not found in cart');
    }

    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }

    item.quantity = quantity;
  }

  clear() {
    this.items = [];
  }

  // =========================
  // DOMAIN COMPUTATION
  // =========================

  getItems(): CartItem[] {
    return this.items;
  }

  getTotal(): CartTotalVO {
    const subtotal = this.items.reduce((sum, item) => {
      return sum.add(item.price.multiply(item.quantity));
    }, new MoneyVO(0));

    return new CartTotalVO(subtotal);
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}
