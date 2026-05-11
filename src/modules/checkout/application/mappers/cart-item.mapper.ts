// src/modules/checkout/application/mappers/cart-item.mapper.ts

import { CartItemEntity } from '@modules/sessions/domain/entities/cart-item.entity';
import { OrderItem } from '@modules/orders/domain/entities/order.entity';
import { MoneyVO } from '../../domain/value-objects/money.vo';

export interface CheckoutSummaryItem {
  name: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

/**
 * CartItemMapper
 * --------------
 * Converts session cart items into normalized order/summary structures.
 */
export class CartItemMapper {
  static toOrderItem(item: CartItemEntity): OrderItem {
    return {
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: new MoneyVO(item.price * item.quantity).value,
    };
  }

  static toSummaryItem(item: CartItemEntity): CheckoutSummaryItem {
    return {
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.price * item.quantity,
    };
  }
}