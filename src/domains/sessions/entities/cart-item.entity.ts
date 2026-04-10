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

  options?: any;

  constructor(partial?: Partial<CartItemEntity>) {
    super(partial);
    Object.assign(this, partial);
  }

  // ✅ ADD THIS (fixes SessionEntity errors)
  updateQuantity(qty: number) {
    this.quantity = qty;
    this.touch?.();
  }

  // ✅ ADD THIS (fixes i.total error)
  get total(): number {
    return this.price * this.quantity;
  }
}