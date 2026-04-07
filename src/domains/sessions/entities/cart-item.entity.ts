// src/domains/sessions/entities/cart-item.entity.ts

import { BaseEntity } from '../../../common/base.entity';
import { CartItemVO } from '../value-objects/cart-item.vo';

export class CartItemEntity extends BaseEntity {
  id?: string;
  productId!: string;
  name!: string;
  quantity!: number;
  price!: number;
  options?: Record<string, any>;

  constructor(vo: CartItemVO, partial?: Partial<CartItemEntity>) {
    super(partial);
    this.productId = vo.productId;
    this.name = vo.name;
    this.quantity = vo.quantity;
    this.price = vo.price;
    this.options = vo.options;
    if (partial) Object.assign(this, partial);
  }

  get total(): number {
    return this.quantity * this.price;
  }

  updateQuantity(newQty: number) {
    this.quantity = newQty;
    this.touch();
  }

  updateOptions(newOptions: Record<string, any>) {
    this.options = { ...this.options, ...newOptions };
    this.touch();
  }
}