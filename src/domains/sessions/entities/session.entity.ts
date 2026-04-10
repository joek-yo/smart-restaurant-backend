// src/domains/sessions/entities/session.entity.ts

import { BaseEntity } from '../../../common/base.entity';
import { CartItemEntity } from './cart-item.entity';
import { SessionStateVO, SessionState } from '../value-objects/session-state.vo';
import { DiscountVO } from '../value-objects/discount.vo';

export class SessionEntity extends BaseEntity {
  id?: string;

  /** Multi-tenant support */
  businessId!: string;
  branchId?: string;
  userId!: string;

  state: SessionStateVO = new SessionStateVO();
  items: CartItemEntity[] = [];
  discount?: DiscountVO;
  expiresAt?: Date;

  constructor(partial?: Partial<SessionEntity>) {
    super(partial);

    if (partial) {
      Object.assign(this, partial);

      if (partial.state) {
        this.state = new SessionStateVO(partial.state.value);
      }

      if (partial.items) {
        this.items = partial.items.map(
          (i) => new CartItemEntity(i as any),
        );
      }
    }
  }

  // =========================
  // COMPATIBILITY FIX (REPOSITORY EXPECTS THIS)
  // =========================
  get status() {
    return this.state?.value;
  }

  addItem(item: CartItemEntity) {
    const existing = this.items.find(
      (i) => i.productId === item.productId,
    );

    if (existing) {
      existing.updateQuantity(existing.quantity + item.quantity);
    } else {
      this.items.push(item);
    }

    this.state.set(SessionState.CART_UPDATED);
    this.touch();
  }

  removeItem(productId: string) {
    this.items = this.items.filter(
      (i) => i.productId !== productId,
    );

    this.state.set(
      this.items.length
        ? SessionState.CART_UPDATED
        : SessionState.BROWSING_MENU,
    );

    this.touch();
  }

  updateQuantity(productId: string, quantity: number) {
    const item = this.items.find(
      (i) => i.productId === productId,
    );

    if (!item) throw new Error('Item not found');

    item.updateQuantity(quantity);

    this.state.set(SessionState.CART_UPDATED);
    this.touch();
  }

  applyDiscount(discount: DiscountVO) {
    this.discount = discount;
    this.touch();
  }

  get totalAmount(): number {
    const subtotal = this.items.reduce(
      (sum, i) => sum + i.total,
      0,
    );

    return this.discount
      ? this.discount.apply(subtotal)
      : subtotal;
  }

  checkout() {
    if (!this.items.length) {
      throw new Error('Cart is empty');
    }

    this.state.set(SessionState.CHECKOUT);
    this.touch();
  }

  expire() {
    this.state.set(SessionState.EXPIRED);
    this.touch();
  }
}