// src/core/events/event-payloads.ts
//
// Typed payloads for all domain events.
// Use these in handlers instead of `any`.

export interface CartUpdatedPayload {
  tenantId: string;
  userId: string;
  cart?: {
    items: { name: string; quantity: number; price: number }[];
    total: number;
  };
}

export interface CheckoutStartedPayload {
  tenantId: string;
  userId: string;
  channel: string;
  sessionId?: string;
}

export interface CheckoutConfirmedPayload {
  tenantId: string;
  userId: string;
  orderDraft?: {
    id?: string;
  };
}

export interface CheckoutFailedPayload {
  tenantId: string;
  userId: string;
  reason: string;
}

export interface OrderCreatedPayload {
  orderId: string;
  businessId: string;
  totalAmount: number;
  customerId: string;
  source: string;
  timestamp: string;
}

export interface OrderStatusUpdatedPayload {
  orderId: string;
  status: string;
  businessId?: string;
}