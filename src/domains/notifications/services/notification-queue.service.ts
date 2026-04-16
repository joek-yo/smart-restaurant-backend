// src/domains/notifications/services/notification-queue.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { Notification } from '../entities/notification.entity';
import { NotificationCreatedEvent } from '../events/notification-created.event';

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);
  private queue: Notification[] = [];
  private isProcessing = false;

  constructor(private readonly eventBus: EventBus) {}

  enqueue(notification: Notification) {
    this.logger.log(`📥 Enqueue: ${notification.recipient}`);
    this.queue.push(notification);
    
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private async processNext() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const notification = this.queue.shift();

    if (notification) {
      this.logger.log(`🚀 Publishing Event for: ${notification.recipient}`);
      // The EventBus triggers the Listener, keeping this service clean
      this.eventBus.publish(new NotificationCreatedEvent(notification));
    }

    // Move to next immediately (Async flow)
    this.processNext();
  }
}