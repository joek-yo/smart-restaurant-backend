// src/modules/business/domain/entities/business-features.ts

/**
 * Feature flags per tenant.
 * Stored in DB — the system reads these to decide what's enabled.
 * All false by default — only what's explicitly enabled works.
 */
export class BusinessFeatures {
  // Catalog
  catalog: boolean = true;        // always on — every business has a catalog
  categories: boolean = true;     // catalog categories

  // Commerce
  orders: boolean = false;        // order placement
  cart: boolean = false;          // shopping cart / sessions
  payments: boolean = false;      // payment processing

  // Bookings (salons, gyms, hotels)
  bookings: boolean = false;

  // Delivery
  delivery: boolean = false;      // delivery support
  pickup: boolean = false;        // pickup/takeaway

  // Channels
  whatsapp: boolean = false;      // WhatsApp ordering
  webStorefront: boolean = false; // web storefront

  // Notifications
  smsNotifications: boolean = false;
  emailNotifications: boolean = false;
  pushNotifications: boolean = false;

  // Analytics
  analytics: boolean = false;

  constructor(partial?: Partial<BusinessFeatures>) {
    if (partial) Object.assign(this, partial);
  }
}

/**
 * Preset feature sets per business type.
 * When a business registers, their type auto-sets sensible defaults.
 */
export const FEATURE_PRESETS: Record<string, Partial<BusinessFeatures>> = {
  restaurant: {
    catalog: true,
    categories: true,
    orders: true,
    cart: true,
    delivery: true,
    pickup: true,
    whatsapp: true,
    webStorefront: true,
    emailNotifications: true,
  },
  retail: {
    catalog: true,
    categories: true,
    orders: true,
    cart: true,
    delivery: true,
    pickup: true,
    webStorefront: true,
    emailNotifications: true,
  },
  salon: {
    catalog: true,
    categories: true,
    bookings: true,
    whatsapp: true,
    smsNotifications: true,
    emailNotifications: true,
  },
  pharmacy: {
    catalog: true,
    categories: true,
    orders: true,
    cart: true,
    delivery: true,
    pickup: true,
    emailNotifications: true,
  },
  gym: {
    catalog: true,
    categories: true,
    bookings: true,
    emailNotifications: true,
    pushNotifications: true,
  },
  general: {
    catalog: true,
    categories: true,
    webStorefront: true,
  },
};
