// FILE: src/domains/sessions/entities/session.entity.ts

import { BaseEntity } from '../../../common/base.entity';
import { CartItemEntity } from './cart-item.entity';
import { SessionStateVO, SessionState } from '../value-objects/session-state.vo';
import { DiscountVO } from '../value-objects/discount.vo';

export class SessionEntity extends BaseEntity {
  id?: string;

  businessId!: string;
  branchId?: string;
  userId!: string;

  state: SessionStateVO = new SessionStateVO();
  items: CartItemEntity[] = [];
  discount?: DiscountVO;
  expiresAt?: Date;

  constructor(partial?: Partial<SessionEntity>) {
    super(partial);

    if (!partial) return;

    this.id = partial.id;
    this.businessId = partial.businessId!;
    this.branchId = partial.branchId;
    this.userId = partial.userId!;

    this.state = partial.state
      ? new SessionStateVO(partial.state.value)
      : new SessionStateVO();

    this.items = partial.items
      ? partial.items.map((i) => new CartItemEntity(i as any))
      : [];

    this.discount = partial.discount;
    this.expiresAt = partial.expiresAt;
  }

  // ==================================================
  // CORE RULE: MUTATION IS ALLOWED INSIDE ENTITY
  // (We STOP cloning to avoid identity corruption)
  // ==================================================

  addItem(item: CartItemEntity): void {
    const existing = this.items.find(
      (i) => i.productId === item.productId,
    );

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push(new CartItemEntity(item));
    }

    this.state = new SessionStateVO(SessionState.CART_UPDATED);
  }

  removeItem(productId: string): void {
    this.items = this.items.filter(
      (i) => i.productId !== productId,
    );

    this.state = new SessionStateVO(
      this.items.length
        ? SessionState.CART_UPDATED
        : SessionState.BROWSING_MENU,
    );
  }

  updateQuantity(productId: string, quantity: number): void {
    const item = this.items.find(
      (i) => i.productId === productId,
    );

    if (!item) {
      throw new Error(`Item not found: ${productId}`);
    }

    item.quantity = quantity;

    this.state = new SessionStateVO(SessionState.CART_UPDATED);
  }

  // ==================================================
  // SESSION ACTIONS
  // ==================================================

  applyDiscount(discount: DiscountVO): void {
    this.discount = discount;
  }

  reset(): void {
    this.items = [];
    this.discount = undefined;
    this.state = new SessionStateVO(SessionState.BROWSING_MENU);
  }

  checkout(): void {
    if (this.items.length === 0) {
      throw new Error('Cart is empty');
    }

    this.state = new SessionStateVO(SessionState.CHECKOUT);
  }

  expire(): void {
    this.state = new SessionStateVO(SessionState.EXPIRED);
  }

  // ==================================================
  // DERIVED VALUE
  // ==================================================

  get totalAmount(): number {
    const subtotal = this.items.reduce(
      (sum, i) => sum + i.total,
      0,
    );

    return this.discount
      ? this.discount.apply(subtotal)
      : subtotal;
  }

  // ==================================================
  // SNAPSHOT (IMPORTANT FOR REPOSITORY)
  // ==================================================
  toSnapshot(): SessionEntity {
    return new SessionEntity({
      id: this.id,
      businessId: this.businessId,
      branchId: this.branchId,
      userId: this.userId,
      state: this.state,
      items: this.items,
      discount: this.discount,
      expiresAt: this.expiresAt,
    });
  }
}