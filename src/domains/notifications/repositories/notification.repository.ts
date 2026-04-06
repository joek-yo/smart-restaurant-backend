// src/domains/notifications/repositories/notification.repository.ts

import { Notification } from '../entities/notification.entity';
import { NotificationStatusEnum } from '../enums/notification-status.enum';

export interface NotificationRepository {
  save(notification: Notification): Promise<Notification>;

  updateStatus(
    id: string,
    status: NotificationStatusEnum,
  ): Promise<void>;

  incrementRetries(id: string): Promise<void>;

  // ✅ NEW (fixes your error)
  findById(id: string): Promise<Notification | null>;
}
