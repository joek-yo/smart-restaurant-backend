// 📁 src/domains/sessions/handlers/abandoned-cart.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AbandonedCartTriggeredEvent } from '../events/abandoned-cart-triggered.event';
import { NotificationRepository } from '../../notifications/repositories/notification.repository';
import { Notification, NotificationStatusEnum } from '../../notifications/entities/notification.entity';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';

@Injectable()
export class AbandonedCartHandler {
  private readonly logger = new Logger(AbandonedCartHandler.name);

  constructor(
    private readonly notificationRepo: NotificationRepository,
    private readonly analyticsAdapter: AnalyticsAdapter,
  ) {}

  @OnEvent('session.abandoned', { async: true })
  async handle(event: AbandonedCartTriggeredEvent) {
    try {
      // 1️⃣ Send abandoned cart notification
      const notification = new Notification({
        type: 'ABANDONED_CART',
        channel: 'EMAIL', // could be dynamic or user preference
        recipient: event.userId,
        payload: {
          sessionId: event.sessionId,
          items: event.cartItems,
        },
        status: NotificationStatusEnum.PENDING,
      });

      await this.notificationRepo.save(notification);

      // 2️⃣ Track analytics event
      await this.analyticsAdapter.track('abandoned_cart', {
        sessionId: event.sessionId,
        userId: event.userId,
        items: event.cartItems,
        timestamp: event.timestamp,
      });

      this.logger.log(`Abandoned cart triggered for session ${event.sessionId}`);
    } catch (err) {
      this.logger.error(
        `Failed to handle AbandonedCartTriggeredEvent for session ${event.sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}