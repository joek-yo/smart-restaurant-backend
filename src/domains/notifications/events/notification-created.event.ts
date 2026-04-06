// src/domains/notifications/events/notification-created.event.ts

import { Notification } from '../entities/notification.entity';

export class NotificationCreatedEvent {
  constructor(public readonly notification: Notification) {}
}