// 📁 src/domains/sessions/types/session.types.ts

import { SessionState } from '../value-objects/session-state.vo';
import { CartItemVO } from '../value-objects/cart-item.vo';
import { DiscountVO } from '../value-objects/discount.vo';

export interface SessionSummary {
  id: string;
  userId: string;
  state: SessionState;
  items: CartItemVO[];
  discount?: DiscountVO;
  totalAmount: number;
  expiresAt?: Date;
}

export type SessionId = string;
export type UserId = string;