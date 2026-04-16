// src/domains/notifications/services/notification-router.service.ts

import { Injectable } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationChannelEnum } from '../enums/notification-channel.enum';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

/**
 * NotificationRouterService
 *
 * 🔥 DECISION ENGINE
 *
 * Responsibilities:
 * - Decide which channel/provider to use
 * - Handle WhatsApp hybrid logic (WABA vs Web)
 * - Keep routing logic centralized
 *
 * DOES NOT:
 * ❌ send messages
 * ❌ handle retries
 */
@Injectable()
export class NotificationRouterService {
  /**
   * Determine final channel/provider for notification
   */
  route(notification: Notification): {
    channel: NotificationChannelEnum;
    provider: 'WABA' | 'WEB' | 'SMS' | 'EMAIL' | 'PUSH';
  } {
    switch (notification.channel) {
      case NotificationChannelEnum.WHATSAPP:
        return this.routeWhatsApp(notification);

      case NotificationChannelEnum.SMS:
        return {
          channel: NotificationChannelEnum.SMS,
          provider: 'SMS',
        };

      case NotificationChannelEnum.EMAIL:
        return {
          channel: NotificationChannelEnum.EMAIL,
          provider: 'EMAIL',
        };

      case NotificationChannelEnum.PUSH:
        return {
          channel: NotificationChannelEnum.PUSH,
          provider: 'PUSH',
        };

      default:
        throw new Error(
          `Unsupported notification channel: ${notification.channel}`,
        );
    }
  }

  /**
   * WhatsApp routing logic (🔥 MOST IMPORTANT)
   *
   * Rules:
   * - TRANSACTIONAL → WABA (safe)
   * - MARKETING / CUSTOM → Web (fallback or campaigns)
   */
  private routeWhatsApp(notification: Notification): {
    channel: NotificationChannelEnum.WHATSAPP;
    provider: 'WABA' | 'WEB';
  } {
    if (notification.type === NotificationTypeEnum.ORDER) {
      return {
        channel: NotificationChannelEnum.WHATSAPP,
        provider: 'WABA', // official API
      };
    }

    // MENU or CUSTOM → treated as marketing / non-critical
    return {
      channel: NotificationChannelEnum.WHATSAPP,
      provider: 'WEB', // fallback / campaign
    };
  }
}