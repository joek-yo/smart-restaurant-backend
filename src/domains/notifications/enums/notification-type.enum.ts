// src/domains/notifications/enums/notification-type.enum.ts

/**
 * Types of notifications in the system
 * - ORDER: triggered when an order is placed or updated
 * - MENU: triggered when a menu item or category changes
 * - CUSTOM: any ad-hoc notification from the system
 */
export enum NotificationTypeEnum {
  ORDER = 'ORDER',
  MENU = 'MENU',
  CUSTOM = 'CUSTOM',
}