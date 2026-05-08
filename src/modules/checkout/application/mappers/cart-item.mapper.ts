// src/modules/checkout/application/mappers/cart-item.mapper.ts

import { MoneyVO } from '../../domain/value-objects/money.vo';

/**
 * CartItemMapper
 * --------------
 * Converts raw session/cart item data into normalized structure
 * for checkout and order layers.
 */

export class CartItemMapper {

  static toOrderItem(item: any) {
    return {
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total: new MoneyVO(item.price * item.quantity).value,
    };
  }

  static toSummaryItem(item: any) {
    return {
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.price * item.quantity,
    };
  }
}