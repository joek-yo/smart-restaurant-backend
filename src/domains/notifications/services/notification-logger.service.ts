import { Injectable, Logger } from '@nestjs/common';
import { Notification } from '../entities/notification.entity';
import { NotificationStatusEnum } from '../enums/notification-status.enum';
import { NotificationRepository } from '../repositories/notification.repository';

/**
 * NotificationLoggerService
 *
 * 🔥 CORE TRACKING ENGINE
 *
 * Responsibilities:
 * - Persist notifications to MongoDB via Repository
 * - Track real-time status changes (SENT, FAILED)
 * - Support the Retry Engine with error tracking
 */
@Injectable()
export class NotificationLoggerService {
  private readonly logger = new Logger(NotificationLoggerService.name);

  constructor(private readonly repository: NotificationRepository) {}

  /**
   * Initial Save: Persist a new notification to the database
   */
  async save(notification: Notification): Promise<void> {
    await this.repository.save(notification);

    this.logger.log(
      `Notification saved to DB: ${notification._id} → ${notification.recipient}`,
    );
  }

  /**
   * Mark notification as SENT in the database
   */
  async markSent(notification: Notification): Promise<void> {
    notification.markSent();

    await this.repository.updateStatus(
      notification._id,
      NotificationStatusEnum.SENT,
    );

    this.logger.log(
      `Notification [SENT]: ${notification._id} → ${notification.recipient}`,
    );
  }

  /**
   * Mark notification as FAILED
   */
  async markFailed(notification: Notification, error: string): Promise<void> {
    notification.markFailed(error);

    await this.repository.updateStatus(
      notification._id,
      NotificationStatusEnum.FAILED,
    );

    this.logger.error(
      `Notification [FAILED]: ${notification._id} → ${notification.recipient} | Error: ${error}`,
    );
  }

  /**
   * Support for Retry Engine: Increments retry count in DB
   */
  async incrementRetries(id: string): Promise<void> {
    await this.repository.incrementRetries(id);
    this.logger.warn(`Incrementing retry count for Notification: ${id}`);
  }

  /**
   * Retrieval logic for auditing or debugging
   */
  async findById(id: string): Promise<Notification | null> {
    // ✅ Clean architecture: use repository.findById
    return await this.repository.findById(id);
  }

  /**
   * Find all failed notifications (placeholder for future implementation)
   */
  async findFailed(): Promise<Notification[]> {
    this.logger.debug('Fetching failed notifications from repository...');
    return [];
  }
}