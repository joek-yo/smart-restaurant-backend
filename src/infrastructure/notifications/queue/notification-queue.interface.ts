// src/infrastructure/notifications/queue/notification-queue.interface.ts

import { Notification } from '../../../domains/notifications/entities/notification.entity';

/**
 * NotificationQueue (Interface)
 *
 * 🔥 ABSTRACTION LAYER FOR QUEUE SYSTEM
 *
 * Purpose:
 * - Decouple domain from queue implementation (Bull, Kafka, etc.)
 * - Allow easy replacement of queue system without touching business logic
 *
 * Implementations:
 * - BullNotificationQueue (current)
 * - KafkaNotificationQueue (future)
 * - RabbitMQNotificationQueue (future)
 */
export interface NotificationQueue {
  /**
   * Add notification to queue for async processing
   */
  add(notification: Notification): Promise<void>;
}