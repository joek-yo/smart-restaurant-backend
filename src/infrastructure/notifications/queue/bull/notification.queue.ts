// src/infrastructure/notifications/queue/bull/notification.queue.ts

import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

// ✅ FIXED: moved from modules → modules
import { MessagePayloadVO } from '@modules/notifications/value-objects/message-payload.vo';

@Injectable()
export class NotificationQueue {
  constructor(
    @InjectQueue('notification') private readonly queue: Queue
  ) {}

  /**
   * Add a notification job to the queue
   */
  async add(payload: MessagePayloadVO) {
    return this.queue.add('send_notification', payload, {
      attempts: 3,
      backoff: 5000,
    });
  }
}