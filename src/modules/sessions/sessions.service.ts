// src/modules/sessions/sessions.service.ts
// Unified SessionService: WhatsApp flow + cart + history (MVP-ready)

import { Injectable } from '@nestjs/common';

// ------------------------
// Types / DTOs for TypeScript (no Swagger)
// ------------------------

export type SessionStep =
  | 'start'
  | 'category_selected'
  | 'product_selected'
  | 'quantity'
  | 'checkout';

export class CartItem {
  product_id!: string;
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
// Service logic
// ------------------------

export interface Session {
  phone: string;
  step: SessionStep;
  history: SessionStep[];
  cart: CartItem[];
  data: Record<string, any>;
}

@Injectable()
export class SessionsService {
  private sessions: Map<string, Session> = new Map();

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

  /** Add item to cart (merge if exists) */
  addToCart(phone: string, item: CartItem) {
    const session = this.getSession(phone);
    const existing = session.cart.find((i) => i.product_id === item.product_id);
    if (existing) {
      existing.quantity += item.quantity;
      existing.total += item.total;
    } else {
      session.cart.push(item);
    }
  }

  /** Get cart */
  getCart(phone: string): CartItem[] {
    return this.getSession(phone).cart;
  }

  /** Clear cart */
  clearCart(phone: string) {
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