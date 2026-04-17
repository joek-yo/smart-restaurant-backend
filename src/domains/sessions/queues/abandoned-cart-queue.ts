// 📁 src/domains/sessions/queues/abandoned-cart-queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import { EventBus } from '../../../common/events/event-bus';
import { NotificationCreatedEvent } from '../../notifications/events/notification-created.event';
import { Notification } from '../../notifications/entities/notification.entity';
import { NotificationStatusEnum } from '../../notifications/enums/notification-status.enum';

@Injectable()
export class AbandonedCartQueue {
  private readonly logger = new Logger(AbandonedCartQueue.name);

  constructor(
    private readonly eventBus: EventBus,
  ) {}

  /**
   * Add a session to the abandoned cart workflow
   */
  async addAbandonedCart(session: SessionEntity): Promise<void> {
    if (!session.items.length) return;

    this.logger.log(`Triggering abandoned cart workflow for session ${session.id}`);

    // Create notification (no persistence)
    const notification = new Notification({
      type: 'ABANDONED_CART',
      channel: 'EMAIL',
      recipient: session.userId,
      payload: {
        sessionId: session.id,
        items: session.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      },
      status: NotificationStatusEnum.PENDING,
    });

    // Emit event ONLY
    this.eventBus.publish(new NotificationCreatedEvent(notification));
  }
}