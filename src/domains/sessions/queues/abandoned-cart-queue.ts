// 📁 src/domains/sessions/queues/abandoned-cart-queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionEntity } from '../entities/session.entity';
import { NotificationRepository } from '../repositories/notification.repository';
import { Notification, NotificationTypeEnum, NotificationChannelEnum } from '../entities/notification.entity';

@Injectable()
export class AbandonedCartQueue {
  private readonly logger = new Logger(AbandonedCartQueue.name);

  constructor(private readonly notificationRepo: NotificationRepository) {}

  /**
   * Add a session to the abandoned cart workflow
   */
  async addAbandonedCart(session: SessionEntity): Promise<void> {
    if (!session.items.length) return; // Nothing to notify

    this.logger.log(`Triggering abandoned cart notification for session ${session.id}`);

    // Example: Create notification for user
    const notification: Notification = new Notification({
      type: NotificationTypeEnum.ABANDONED_CART,
      channel: NotificationChannelEnum.EMAIL, // Can be SMS, WhatsApp, etc.
      recipient: session.userId, // Assuming userId maps to email/phone externally
      payload: { sessionId: session.id, items: session.items.map(i => ({ productId: i.productId, quantity: i.quantity })) },
    });

    await this.notificationRepo.save(notification);
  }
}