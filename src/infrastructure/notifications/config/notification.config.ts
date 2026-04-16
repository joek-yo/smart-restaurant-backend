// src/infrastructure/notifications/config/notification.config.ts

/**
 * Notification Configuration
 *
 * 🔥 CENTRALIZED SYSTEM CONTROL
 *
 * Purpose:
 * - Control retries, channels, and behavior
 * - Avoid hardcoding values inside services
 * - Enable environment-based configuration later
 */

export const notificationConfig = {
  /**
   * Retry behavior
   */
  retry: {
    maxAttempts: 3,        // max retry attempts
    delay: 5000,           // delay between retries (ms)
  },

  /**
   * WhatsApp configuration
   */
  whatsapp: {
    wabaEnabled: true,     // use official API
    webFallbackEnabled: true, // fallback to web if WABA fails
  },

  /**
   * SMS channel toggle
   */
  sms: {
    enabled: true,
  },

  /**
   * Email channel toggle
   */
  email: {
    enabled: true,
  },

  /**
   * Push notifications toggle
   */
  push: {
    enabled: true,
  },
};