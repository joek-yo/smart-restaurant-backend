// FILE: src/modules/sessions/domain/entities/session.entity.ts

import { BaseEntity } from '@common/base.entity';

import { CartItemEntity } from './cart-item.entity';

import {
  SessionStateVO,
  SessionState,
} from '../value-objects/session-state.vo';

import { DiscountVO } from '../value-objects/discount.vo';

export interface SessionRecoveryMetadata {
  recoveredAt: Date;
  reason: string;
  previousState: SessionState;
}

export interface SessionCheckoutMetadata {
  startedAt?: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
}

/**
 * SessionEntity
 * -------------
 * SINGLE SOURCE OF TRUTH FOR:
 * - cart
 * - checkout state
 * - session lifecycle
 *
 * IMPORTANT:
 * Conversation module MUST NEVER own:
 * - cart items
 * - totals
 * - checkout truth
 *
 * Canonical ownership:
 * tenantId = businessId
 */
export class SessionEntity extends BaseEntity {
  id?: string;

  /**
   * Legacy persistence field.
   * Canonical accessor = tenantId
   */
  businessId!: string;

  branchId?: string;

  userId!: string;

  state: SessionStateVO = new SessionStateVO();

  items: CartItemEntity[] = [];

  discount?: DiscountVO;

  expiresAt?: Date;

  recovery?: SessionRecoveryMetadata;

  checkout?: SessionCheckoutMetadata;

  constructor(partial?: Partial<SessionEntity>) {
    super(partial);

    if (!partial) {
      return;
    }

    this.id = partial.id;

    this.businessId =
      partial.businessId ??
      (partial as any).tenantId ??
      'default';

    this.branchId = partial.branchId;

    this.userId = partial.userId!;

    this.state = partial.state
      ? new SessionStateVO(partial.state.value)
      : new SessionStateVO();

    this.items = partial.items
      ? partial.items.map(
          (item) => new CartItemEntity(item),
        )
      : [];

    this.discount = partial.discount;

    this.expiresAt =
      partial.expiresAt ??
      new Date(Date.now() + 1000 * 60 * 60 * 3);

    this.recovery = partial.recovery;

    this.checkout = partial.checkout;
  }

  // ─────────────────────────────────────────────
  // Canonical tenant accessor
  // ─────────────────────────────────────────────

  get tenantId(): string {
    return this.businessId;
  }

  // ─────────────────────────────────────────────
  // Session Status Helpers
  // ─────────────────────────────────────────────

  get isExpired(): boolean {
    return this.state.is(SessionState.EXPIRED);
  }

  get isCheckoutActive(): boolean {
    return this.state.is(SessionState.CHECKOUT);
  }

  get hasItems(): boolean {
    return this.items.length > 0;
  }

  // ─────────────────────────────────────────────
  // Cart Mutation Logic
  // ─────────────────────────────────────────────

  addItem(item: CartItemEntity): void {
    if (this.isExpired) {
      throw new Error(
        'Cannot modify expired session',
      );
    }

    const existing = this.items.find(
      (i) => i.productId === item.productId,
    );

    if (existing) {
      existing.increase(item.quantity);
    } else {
      this.items.push(
        new CartItemEntity({
          ...item,
          sessionId: this.id,
          businessId: this.businessId,
          branchId: this.branchId,
        }),
      );
    }

    this.state.set(SessionState.CART_UPDATED);

    this.touch();
  }

  removeItem(productId: string): void {
    if (this.isExpired) {
      throw new Error(
        'Cannot modify expired session',
      );
    }

    this.items = this.items.filter(
      (item) => item.productId !== productId,
    );

    this.state.set(
      this.items.length
        ? SessionState.CART_UPDATED
        : SessionState.BROWSING_MENU,
    );

    this.touch();
  }

  updateQuantity(
    productId: string,
    quantity: number,
  ): void {
    if (this.isExpired) {
      throw new Error(
        'Cannot modify expired session',
      );
    }

    if (quantity <= 0) {
      throw new Error(
        'Quantity must be greater than zero',
      );
    }

    const item = this.items.find(
      (i) => i.productId === productId,
    );

    if (!item) {
      throw new Error(
        `Item not found: ${productId}`,
      );
    }

    item.updateQuantity(quantity);

    this.state.set(SessionState.CART_UPDATED);

    this.touch();
  }

  clearCart(): void {
    this.items = [];

    this.discount = undefined;

    this.state.set(SessionState.BROWSING_MENU);

    this.touch();
  }

  // ─────────────────────────────────────────────
  // Checkout Lifecycle
  // ─────────────────────────────────────────────

  checkoutStart(): void {
    if (this.items.length === 0) {
      throw new Error(
        'Cannot start checkout with empty cart',
      );
    }

    if (this.isExpired) {
      throw new Error(
        'Cannot checkout expired session',
      );
    }

    this.state.set(SessionState.CHECKOUT);

    this.checkout = {
      ...this.checkout,
      startedAt: new Date(),
    };

    this.touch();
  }

  checkoutConfirmed(): void {
    if (
      !this.state.is(SessionState.CHECKOUT)
    ) {
      throw new Error(
        'Checkout must be active before confirmation',
      );
    }

    this.checkout = {
      ...this.checkout,
      confirmedAt: new Date(),
    };

    this.touch();
  }

  checkoutCompleted(): void {
    this.state.set(SessionState.COMPLETED);

    this.checkout = {
      ...this.checkout,
      completedAt: new Date(),
    };

    this.touch();
  }

  checkoutCancelled(): void {
    this.state.set(
      this.items.length
        ? SessionState.CART_UPDATED
        : SessionState.BROWSING_MENU,
    );

    this.checkout = {
      ...this.checkout,
      cancelledAt: new Date(),
    };

    this.touch();
  }

  // ─────────────────────────────────────────────
  // Recovery Lifecycle
  // ─────────────────────────────────────────────

  markRecovered(reason: string): void {
    this.recovery = {
      recoveredAt: new Date(),
      reason,
      previousState: this.state.value,
    };

    this.touch();
  }

  clearRecovery(): void {
    this.recovery = undefined;

    this.touch();
  }

  // ─────────────────────────────────────────────
  // Session Expiration
  // ─────────────────────────────────────────────

  expire(): void {
    this.state.set(SessionState.EXPIRED);

    this.touch();
  }

  extendExpiry(hours = 3): void {
    this.expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * hours,
    );

    this.touch();
  }

  // ─────────────────────────────────────────────
  // Discount Handling
  // ─────────────────────────────────────────────

  applyDiscount(
    discount: DiscountVO,
  ): void {
    this.discount = discount;

    this.touch();
  }

  // ─────────────────────────────────────────────
  // Totals
  // ─────────────────────────────────────────────

  calculateTotal(): number {
    return this.totalAmount;
  }

  get subtotal(): number {
    return this.items.reduce(
      (sum, item) => sum + item.total,
      0,
    );
  }

  get totalAmount(): number {
    return this.discount
      ? this.discount.apply(this.subtotal)
      : this.subtotal;
  }

  // ─────────────────────────────────────────────
  // Snapshot
  // ─────────────────────────────────────────────

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
      recovery: this.recovery,
      checkout: this.checkout,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  // ─────────────────────────────────────────────
  // Internal
  // ─────────────────────────────────────────────

  touch(): void {
    this.updatedAt = new Date();
  }
}