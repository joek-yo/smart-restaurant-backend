// src/application/notifications/dto/create-notification.dto.ts

import { NotificationChannelEnum } from '@modules/notifications/enums/notification-channel.enum';
import { NotificationTypeEnum } from '@modules/notifications/enums/notification-type.enum';

/**
 * CreateNotificationDto
 *
 * 🔥 APPLICATION LAYER CONTRACT
 *
 * Defines how external systems interact with notification system
 *
 * Used by:
 * - Controllers
 * - Events (Orders, Menu, etc.)
 * - Gateways
 */
export class CreateNotificationDto {
  /**
   * Target recipient
   * Example:
   * - phone number (WhatsApp, SMS)
   * - email address
   * - device token (push)
   */
  recipient!: string;

  /**
   * Channel to send through
   * (WHATSAPP, SMS, EMAIL, PUSH)
   */
  channel!: NotificationChannelEnum;

  /**
   * Notification type
   * (ORDER, MARKETING, SYSTEM, etc.)
   */
  type!: NotificationTypeEnum;

  /**
   * Plain message (fallback / simple messages)
   */
  message?: string;

  /**
   * Optional title (used in email/push)
   */
  title?: string;

  /**
   * Template name (for WABA or structured messages)
   */
  templateName?: string;

  /**
   * Template parameters
   * Example:
   * { name: "John", orderId: "1234" }
   */
  templateParams?: Record<string, any>;
}