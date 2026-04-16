// 📁 src/domains/sessions/constants/session-states.ts

export enum SessionStatus {
  START = 'START',
  BROWSING_MENU = 'BROWSING_MENU',
  CART_UPDATED = 'CART_UPDATED',
  CHECKOUT = 'CHECKOUT',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  ABANDONED = 'ABANDONED',
}

export const SESSION_EXPIRY_MINUTES = 30; // default session expiry
export const CART_ITEM_MAX_QUANTITY = 20; // max quantity per item
export const CART_MAX_ITEMS = 50; // max distinct items in cart