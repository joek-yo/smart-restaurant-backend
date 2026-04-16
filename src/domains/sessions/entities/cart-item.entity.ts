// FILE: src/domains/sessions/entities/cart-item.entity.ts

import { BaseEntity } from '../../../common/base.entity';

export class CartItemEntity extends BaseEntity {
  id?: string;

  sessionId!: string;
  businessId!: string;
  branchId?: string;

  productId!: string;
  name!: string;

  quantity: number = 1;
  price: number = 0;

  // keep flexible but safe
  options?: Record<string, any>;

  constructor(partial?: Partial<CartItemEntity>) {
    super(partial);

    if (partial) {
      Object.assign(this, partial);
    }

    // 🔒 safety defaults (prevents NaN / undefined bugs)
    this.quantity = this.quantity ?? 1;
    this.price = this.price ?? 0;
  }

  // =========================
  // DOMAIN BEHAVIOR
  // =========================

  updateQuantity(qty: number) {
    if (qty <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    this.quantity = qty;
    this.touch?.();
  }

  increase(qty: number = 1) {
    this.quantity += qty;
    this.touch?.();
  }

  decrease(qty: number = 1) {
    const newQty = this.quantity - qty;

    if (newQty <= 0) {
      throw new Error('Quantity cannot be zero or negative');
    }

    this.quantity = newQty;
    this.touch?.();
  }

  // =========================
  // DERIVED VALUE
  // =========================

  get total(): number {
    return this.price * this.quantity;
  }

  // =========================
  // DOMAIN HELPERS
  // =========================

  isSameProduct(productId: string): boolean {
    return this.productId === productId;
  }
}