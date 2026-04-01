// src/modules/sessions/cart.service.ts
// Handles cart logic safely using PRODUCT SNAPSHOT

import { Injectable } from '@nestjs/common';

/**
 * Cart item stored for a user
 */
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  image_url?: string;

  quantity: number;
  total_price: number;
}

/**
 * Snapshot of a product (taken at the time of adding to cart)
 * This avoids TypeScript issues with Mongoose _id or optional fields
 */
export type ProductSnapshot = {
  _id: string;        // MongoDB ID as string
  name: string;
  price: number;
  image_url?: string;
};

@Injectable()
export class CartService {
  private carts = new Map<string, CartItem[]>();

  /**
   * Get cart for a user
   */
  getCart(userId: string): CartItem[] {
    return this.carts.get(userId) || [];
  }

  /**
   * Add a product to cart using snapshot
   */
  addToCart(
    userId: string,
    product: ProductSnapshot,
    quantity = 1,   // default quantity = 1
  ): CartItem[] {
    const cart = this.getCart(userId);

    // Check if product already exists in cart
    const existingItem = cart.find(
      (item) => item.productId === product._id,
    );

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      existingItem.total_price = existingItem.quantity * existingItem.price;
    } else {
      // Add new item as snapshot
      const newItem: CartItem = {
        productId: product._id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity,
        total_price: product.price * quantity,
      };

      cart.push(newItem);
    }

    this.carts.set(userId, cart);
    return cart;
  }

  /**
   * Remove item from cart
   */
  removeFromCart(userId: string, productId: string): CartItem[] {
    const cart = this.getCart(userId).filter(
      (item) => item.productId !== productId,
    );

    this.carts.set(userId, cart);
    return cart;
  }

  /**
   * Clear a user's cart
   */
  clearCart(userId: string): void {
    this.carts.set(userId, []);
  }

  /**
   * Get total price of the cart
   */
  getTotal(userId: string): number {
    const cart = this.getCart(userId);
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  }
}