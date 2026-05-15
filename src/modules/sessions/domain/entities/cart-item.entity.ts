// FILE: src/modules/sessions/domain/entities/cart-item.entity.ts

import { BaseEntity } from '@common/base.entity';

export class CartItemEntity extends BaseEntity {
  id?: string;

  sessionId!: string;

  /**
   * Legacy persistence name.
   * Canonical accessor = tenantId
   */
  businessId!: string;

  branchId?: string;

  productId!: string;

  name!: string;

  quantity: number = 1;

  price: number = 0;

  options?: Record<string, any>;

  constructor(partial?: Partial<CartItemEntity>) {
    super(partial);

    if (!partial) {
      return;
    }

    Object.assign(this, partial);

    this.businessId =
      partial.businessId ??
      (partial as any).tenantId ??
      'default';

    this.quantity = this.normalizeQuantity(
      partial.quantity,
    );

    this.price = this.normalizePrice(
      partial.price,
    );

    this.validate();
  }

  // ─────────────────────────────────────────────
  // Canonical tenant accessor
  // ─────────────────────────────────────────────

  get tenantId(): string {
    return this.businessId;
  }

  // ─────────────────────────────────────────────
  // Quantity Logic
  // ─────────────────────────────────────────────

  updateQuantity(quantity: number): void {
    this.quantity =
      this.normalizeQuantity(quantity);

    this.touch();
  }

  increase(quantity = 1): void {
    const safeQty =
      this.normalizeQuantity(quantity);

    this.quantity += safeQty;

    this.touch();
  }

  decrease(quantity = 1): void {
    const safeQty =
      this.normalizeQuantity(quantity);

    const nextQuantity =
      this.quantity - safeQty;

    if (nextQuantity <= 0) {
      throw new Error(
        'Quantity cannot be zero or negative',
      );
    }

    this.quantity = nextQuantity;

    this.touch();
  }

  // ─────────────────────────────────────────────
  // Price Logic
  // ─────────────────────────────────────────────

  updatePrice(price: number): void {
    this.price = this.normalizePrice(price);

    this.touch();
  }

  // ─────────────────────────────────────────────
  // Derived Values
  // ─────────────────────────────────────────────

  get total(): number {
    return Number(
      (this.price * this.quantity).toFixed(2),
    );
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  isSameProduct(productId: string): boolean {
    return this.productId === productId;
  }

  clone(): CartItemEntity {
    return new CartItemEntity({
      id: this.id,
      sessionId: this.sessionId,
      businessId: this.businessId,
      branchId: this.branchId,
      productId: this.productId,
      name: this.name,
      quantity: this.quantity,
      price: this.price,
      options: this.options,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    });
  }

  // ─────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────

  private validate(): void {
    if (!this.productId?.trim()) {
      throw new Error(
        'Cart item productId is required',
      );
    }

    if (!this.name?.trim()) {
      throw new Error(
        'Cart item name is required',
      );
    }

    if (!Number.isFinite(this.quantity)) {
      throw new Error(
        'Cart item quantity must be finite',
      );
    }

    if (!Number.isFinite(this.price)) {
      throw new Error(
        'Cart item price must be finite',
      );
    }

    if (this.quantity <= 0) {
      throw new Error(
        'Cart item quantity must be greater than zero',
      );
    }

    if (this.price < 0) {
      throw new Error(
        'Cart item price cannot be negative',
      );
    }
  }

  private normalizeQuantity(
    quantity?: number,
  ): number {
    const normalized =
      quantity ?? 1;

    if (
      !Number.isFinite(normalized) ||
      Number.isNaN(normalized)
    ) {
      throw new Error(
        'Invalid cart quantity',
      );
    }

    if (normalized <= 0) {
      throw new Error(
        'Quantity must be greater than zero',
      );
    }

    return Math.floor(normalized);
  }

  private normalizePrice(
    price?: number,
  ): number {
    const normalized =
      price ?? 0;

    if (
      !Number.isFinite(normalized) ||
      Number.isNaN(normalized)
    ) {
      throw new Error(
        'Invalid cart price',
      );
    }

    if (normalized < 0) {
      throw new Error(
        'Price cannot be negative',
      );
    }

    return Number(normalized.toFixed(2));
  }

  // ─────────────────────────────────────────────
  // Internal
  // ─────────────────────────────────────────────

  toSnapshot(): Record<string, any> {
    return {
      id: this.id,
      sessionId: this.sessionId,
      businessId: this.businessId,
      branchId: this.branchId,
      productId: this.productId,
      name: this.name,
      quantity: this.quantity,
      price: this.price,
      total: this.total,
      options: this.options,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  touch(): void {
    this.updatedAt = new Date();
  }
}