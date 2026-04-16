// src/domains/notifications/enums/notification-channel.enum.ts

/**
 * Channels we can send notifications through
 * Can be extended easily with new channels
 */
export enum NotificationChannelEnum {
  WHATSAPP = 'WHATSAPP',
  WEB = 'WEB',        // web app push notifications
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',      // mobile push
}