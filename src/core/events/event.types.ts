// src/core/events/event.types.ts

export interface DomainEvent<T = any> {
  name: string;
  payload: T;
  timestamp: Date;
}

export type EventPayloadMap = {
  // Business events
  'business.created': { businessId: string; name: string };
  'business.updated': { businessId: string };

  // Order events
  'order.created': { orderId: string; businessId: string };
  'order.status.updated': { orderId: string; status: string };

  // Product events (future)
  'product.created': { productId: string; businessId: string };
};