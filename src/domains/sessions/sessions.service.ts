// src/modules/sessions/sessions.service.ts
// Unified SessionService: WhatsApp flow + cart + history (MVP-ready)

import { Injectable } from '@nestjs/common';
import { CartService, ProductSnapshot, CartItem as ServiceCartItem } from './cart.service';

// ------------------------
// Types / DTOs for TypeScript
// ------------------------

export type SessionStep =
  | 'start'
  | 'category_selected'
  | 'product_selected'
  | 'quantity'
  | 'checkout';

export class CartItem {
  productId!: string;
  name!: string;
  price!: number;
  quantity!: number;
  total!: number;
}

export class SessionResponseDto {
  phone!: string;
  step!: SessionStep;
  history!: SessionStep[];
  cart!: CartItem[];
  data!: Record<string, any>;
}

// ------------------------
// Session interface
// ------------------------

export interface Session {
  phone: string;
  step: SessionStep;
  history: SessionStep[];
  cart: ServiceCartItem[]; // use CartService type internally
  data: Record<string, any>;
}

// ------------------------
// Service logic
// ------------------------

@Injectable()
export class SessionsService {
  private sessions: Map<string, Session> = new Map();

  constructor(private readonly cartService: CartService) {}

  /** Get or create session */
  getSession(phone: string): Session {
    if (!this.sessions.has(phone)) {
      this.sessions.set(phone, {
        phone,
        step: 'start',
        history: [],
        cart: [],
        data: {},
      });
    }
    return this.sessions.get(phone)!;
  }

  /** Set step + track history */
  setStep(phone: string, step: SessionStep) {
    const session = this.getSession(phone);
    if (session.step !== step) {
      session.history.push(session.step);
      session.step = step;
    }
  }

  /** Go back to previous step */
  goBack(phone: string): SessionStep | null {
    const session = this.getSession(phone);
    const prev = session.history.pop();
    if (prev) {
      session.step = prev;
      return prev;
    }
    return null;
  }

  /** Set selected category */
  setCategory(phone: string, categoryId: string) {
    this.getSession(phone).data.selected_category = categoryId;
  }

  /** Set selected product */
  setProduct(phone: string, productId: string) {
    this.getSession(phone).data.selected_product = productId;
  }

  /** Generic data setter */
  setData(phone: string, key: string, value: any) {
    this.getSession(phone).data[key] = value;
  }

  /** Generic data getter */
  getData(phone: string, key: string) {
    return this.getSession(phone).data[key];
  }

  /** Add item to cart using CartService */
  addToCart(phone: string, product: ProductSnapshot, quantity = 1) {
    const session = this.getSession(phone);

    // Delegate to CartService
    const updatedCart = this.cartService.addToCart(phone, product, quantity);

    // Update session cart
    session.cart = updatedCart;
  }

  /** Get cart */
  getCart(phone: string): ServiceCartItem[] {
    return this.cartService.getCart(phone);
  }

  /** Clear cart */
  clearCart(phone: string) {
    this.cartService.clearCart(phone);
    this.getSession(phone).cart = [];
  }

  /** Reset session */
  resetSession(phone: string) {
    this.sessions.set(phone, {
      phone,
      step: 'start',
      history: [],
      cart: [],
      data: {},
    });
  }
}