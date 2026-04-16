// src/domains/notifications/enums/notification-status.enum.ts

/**
 * Status lifecycle of a notification
 * - PENDING: not yet processed
 * - SENT: successfully delivered
 * - FAILED: failed delivery, can retry
 * - CANCELLED: abandoned, no further processing
 */
export enum NotificationStatusEnum {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}