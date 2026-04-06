// src/domains/notifications/services/notification-retry.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationDispatcherService } from './notification-dispatcher.service';

/**
 * NotificationRetryService
 *
 * Handles retrying failed notifications with exponential backoff.
 */
@Injectable()
export class NotificationRetryService {
  private readonly logger = new Logger(NotificationRetryService.name);

  // Default retry policy
  private readonly maxAttempts = 5;
  private readonly baseDelayMs = 1000; // 1 second

  constructor(private readonly dispatcher: NotificationDispatcherService) {}

  /**
   * Retry a notification delivery
   */
  async retry(notification: Notification, attempt = 1): Promise<void> {
    if (attempt > this.maxAttempts) {
      this.logger.error(
        `Notification permanently failed after ${this.maxAttempts} attempts → ${notification._id}`,
      );
      return;
    }

    try {
      this.logger.log(
        `Retrying notification ${notification._id} attempt ${attempt}`,
      );

      await this.dispatcher.dispatch(notification);

      this.logger.log(
        `Notification ${notification._id} successfully delivered on attempt ${attempt}`,
      );
    } catch (error) {
      const delay = this.calculateDelay(attempt);

      // ✅ Cast error as any
      this.logger.warn(
        `Retry attempt ${attempt} failed for notification ${notification._id}. Retrying in ${delay}ms`,
        (error as any).stack,
      );

      await this.sleep(delay);

      await this.retry(notification, attempt + 1);
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateDelay(attempt: number): number {
    return this.baseDelayMs * Math.pow(2, attempt - 1);
  }

  /**
   * Simple sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}