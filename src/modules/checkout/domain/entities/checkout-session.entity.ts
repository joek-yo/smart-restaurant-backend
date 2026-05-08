/**
 * FILE: src/modules/checkout/domain/entities/checkout-session.entity.ts
 *
 * 🧾 CHECKOUT SESSION ENTITY
 * --------------------------
 * Controls lifecycle of checkout flow per user.
 * Owns:
 * - Cart
 * - Status
 * - Locking
 */

import { CartEntity } from './cart.entity';
import { CheckoutStatus, CheckoutStatusVO } from '../value-objects/checkout-status.vo';

export class CheckoutSessionEntity {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    public readonly cart: CartEntity,
    private status: CheckoutStatusVO = new CheckoutStatusVO(),
    private locked: boolean = false,
  ) {}

  // =========================
  // STATUS CONTROL
  // =========================

  getStatus(): CheckoutStatus {
    return this.status.value;
  }

  transitionTo(next: CheckoutStatus) {
    this.status = this.status.transition(next);
  }

  // =========================
  // LOCKING (CRITICAL SAFETY)
  // =========================

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  isLocked(): boolean {
    return this.locked;
  }

  // =========================
  // BUSINESS RULES
  // =========================

  addItem(productId: string, name: string, quantity: number, price: any) {
    if (this.locked) {
      throw new Error('Checkout is locked');
    }

    this.cart.addItem({
      productId,
      name,
      quantity,
      price,
    });

    this.transitionTo(CheckoutStatus.READY_TO_CHECKOUT);
  }

  removeItem(productId: string) {
    if (this.locked) return;
    this.cart.removeItem(productId);
  }

  startCheckout() {
    if (this.cart.isEmpty()) {
      throw new Error('Cannot checkout empty cart');
    }

    this.transitionTo(CheckoutStatus.CHECKOUT_STARTED);
  }

  calculateTotal() {
    return this.cart.getTotal();
  }
}
