// 📁 src/domains/sessions/types/cart-item.types.ts

import { CartItemOptions } from '../value-objects/cart-item.vo';

export interface CartItemData {
  id: string;
  sessionId: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  options?: CartItemOptions;
  total: number;
}

export type CartItemId = string;
export type SessionId = string;