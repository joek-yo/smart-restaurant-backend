// FILE: src/core/events/event.types.ts

export interface DomainEvent<T = any> {
  name: string;
  payload: T;
  timestamp: Date;
}

/**
 * CENTRAL EVENT REGISTRY
 * This controls ALL allowed events in the system.
 * If it's not here → it cannot be emitted.
 */
export type EventPayloadMap = {
  // ==================================================
  // BUSINESS EVENTS
  // ==================================================
  'business.created': { businessId: string; name: string };
  'business.updated': { businessId: string };
  'business.deleted': { businessId: string };

  'restaurant.settings.updated': {
    businessId: string;
    settings: any;
  };

  // ==================================================
  // PRODUCT EVENTS
  // ==================================================
  'product.created': { productId: string; businessId: string; product: any };
  'product.updated': { productId: string; businessId?: string; product: any };
  'product.deleted': { productId: string };

  'category.created': { category: any; businessId: string };
  'category.updated': { category: any };
  'category.deleted': { id: string };

  // ==================================================
  // SESSION EVENTS
  // ==================================================
  'session.created': { sessionId: string; userId: string; tenantId: string };
  'session.updated': { sessionId: string };

  'session.cart.item.added': {
    sessionId: string;
    productId: string;
    quantity: number;
  };

  'session.cart.item.removed': {
    sessionId: string;
    productId: string;
  };

  // ==================================================
  // CHECKOUT EVENTS
  // ==================================================
  'checkout.started': { sessionId: string };
  'checkout.completed': { sessionId: string };
  'checkout.cancelled': { sessionId: string };

  // ==================================================
  // ORDER EVENTS (existing)
  // ==================================================
  'order.created': { orderId: string; businessId: string };
  'order.status.updated': { orderId: string; status: string };
};