// src/domains/notifications/services/notification-factory.service.ts

import { Injectable } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationChannelEnum } from '../enums/notification-channel.enum';
import { NotificationStatusEnum } from '../enums/notification-status.enum';
import { NotificationTypeEnum } from '../enums/notification-type.enum';
import { MessagePayloadVO } from '../value-objects/message-payload.vo';
import { randomUUID } from 'crypto';

/**
 * NotificationFactoryService
 *
 * Responsible for constructing valid Notification entities.
 * Applies defaults, validation, and normalization.
 *
 * This ensures:
 * - consistency
 * - no invalid objects enter the system
 * - easy extensibility (AI, templates, personalization later)
 */
@Injectable()
export class NotificationFactoryService {
  /**
   * Create a new notification
   */
  create(input: {
    businessId: string;
    recipient: string;
    channel: NotificationChannelEnum;
    type: NotificationTypeEnum;
    payload: MessagePayloadVO;
  }): Notification {
    this.validateInput(input);

    const notification = new Notification();

    // Core identity
    (notification as any).id = randomUUID();

    // Business context
    (notification as any).businessId = input.businessId;
    (notification as any).recipient = this.normalizeRecipient(input.recipient);

    // Messaging config
    (notification as any).channel = input.channel;
    (notification as any).type = input.type;
    (notification as any).payload = input.payload;

    // Lifecycle defaults
    (notification as any).status = NotificationStatusEnum.PENDING;
    (notification as any).retryCount = 0;

    return notification;
  }

  /**
   * Validate input before creating notification
   */
  private validateInput(input: {
    businessId: string;
    recipient: string;
    channel: NotificationChannelEnum;
    type: NotificationTypeEnum;
    payload: MessagePayloadVO;
  }) {
    if (!input.businessId) {
      throw new Error('businessId is required');
    }

    if (!input.recipient) {
      throw new Error('recipient is required');
    }

    if (!input.channel) {
      throw new Error('channel is required');
    }

    if (!input.type) {
      throw new Error('type is required');
    }

    if (!input.payload) {
      throw new Error('payload is required');
    }
  }

  /**
   * Normalize recipient (especially phone numbers)
   */
  private normalizeRecipient(recipient: string): string {
    // Basic normalization — can be expanded later
    return recipient.trim();
  }
}