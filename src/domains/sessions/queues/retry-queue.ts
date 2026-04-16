// 📁 src/domains/sessions/queues/retry-queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { SessionEntity } from '../entities/session.entity';
import { NotificationStatusEnum } from '../enums/notification-status.enum';

@Injectable()
export class RetryQueue {
  private readonly logger = new Logger(RetryQueue.name);

  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly notificationRepo: NotificationRepository,
  ) {}

  /**
   * Retry failed sessions or notifications
   */
  async processRetry(sessionId?: string): Promise<void> {
    if (sessionId) {
      const session = await this.sessionRepo.findById(sessionId);
      if (session) {
        await this.retrySession(session);
      }
      return;
    }

    // Retry all sessions in EXPIRED or FAILED state
    const sessions = await this.sessionRepo.findByStatus('FAILED'); // Use your SessionStatus enum here
    for (const session of sessions) {
      await this.retrySession(session);
    }
  }

  private async retrySession(session: SessionEntity) {
    this.logger.log(`Retrying session ${session.id}`);

    try {
      // Example: Re-attempt sending abandoned cart notifications
      const notifications = await this.notificationRepo.findByStatus(NotificationStatusEnum.FAILED);
      for (const notif of notifications) {
        if (notif.canRetry()) {
          try {
            // Add your notification sending logic here
            // e.g., WhatsAppAdapter.send(notif)
            notif.markSent();
            await this.notificationRepo.updateStatus(notif.id, NotificationStatusEnum.SENT);
          } catch (error: any) {
            notif.markFailed(error.message);
            await this.notificationRepo.incrementRetries(notif.id);
          }
        }
      }
    } catch (error: any) {
      this.logger.error(`Failed to retry session ${session.id}: ${error.message}`);
    }
  }
}