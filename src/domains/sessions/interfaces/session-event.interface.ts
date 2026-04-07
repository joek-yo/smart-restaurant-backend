// 📁 src/domains/sessions/interfaces/session-event.interface.ts

/**
 * Base contract for all session-related domain events
 */
export interface SessionEvent<T = any> {
  eventType: string;
  sessionId: string;
  userId: string;
  timestamp: Date;
  payload: T;
}

/**
 * Specific payload contracts (strong typing per event)
 */

export interface CartItemAddedPayload {
  productId: string;
  quantity: number;
  name?: string;
  price?: number;
}

export interface CartItemRemovedPayload {
  productId: string;
}

export interface QuantityUpdatedPayload {
  productId: string;
  quantity: number;
}

export interface SessionCheckedOutPayload {
  totalAmount: number;
  itemCount: number;
  paymentMethod?: string;
}

export interface SessionExpiredPayload {
  reason?: string;
}

export interface AbandonedCartPayload {
  lastActiveAt: Date;
  itemCount: number;
}