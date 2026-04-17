// 📁 src/domains/sessions/handlers/abandoned-cart.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AbandonedCartTriggeredEvent } from '../events/abandoned-cart-triggered.event';
import { AnalyticsAdapter } from '../adapters/analytics.adapter';
import { EventBus } from '../../../common/events/event-bus';
import { NotificationCreatedEvent } from '../../notifications/events/notification-created.event';
import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationStatusEnum } from '../../notifications/enums/notification-status.enum';

@Injectable()
export class AbandonedCartHandler {
  private readonly logger = new Logger(AbandonedCartHandler.name);

  constructor(
    private readonly analyticsAdapter: AnalyticsAdapter,
    private readonly eventBus: EventBus,
  ) {}

  @OnEvent('session.abandoned', { async: true })
  async handle(event: AbandonedCartTriggeredEvent) {
    try {
      // 1️⃣ Create notification (NO repository access)
      const notification = new Notification({
        type: 'ABANDONED_CART',
        channel: 'EMAIL',
        recipient: event.userId,
        payload: {
          sessionId: event.sessionId,
          items: event.cartItems,
        },
        status: NotificationStatusEnum.PENDING,
      });

      // 2️⃣ Publish event instead of saving directly
      this.eventBus.publish(new NotificationCreatedEvent(notification));

      // 3️⃣ Analytics stays here (allowed)
      await this.analyticsAdapter.track('abandoned_cart', {
        sessionId: event.sessionId,
        userId: event.userId,
        items: event.cartItems,
        timestamp: event.timestamp,
      });

      this.logger.log(`Abandoned cart event emitted for session ${event.sessionId}`);
    } catch (err) {
      this.logger.error(
        `Failed to handle AbandonedCartTriggeredEvent for session ${event.sessionId}`,
        err as any,
      );
      throw err;
    }
  }
}