// src/infrastructure/notifications/queue/bull/notification.queue.ts

import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { MessagePayloadVO } from '@domains/notifications/value-objects/message-payload.vo'; // ✅ Import via alias

@Injectable()
export class NotificationQueue {
  constructor(
    @InjectQueue('notification') private readonly queue: Queue
  ) {}

  /**
   * Add a notification job to the queue
   */
  async add(payload: MessagePayloadVO) {
    const jobData = payload as any; // cast if dispatcher expects Notification entity

    return this.queue.add('send_notification', jobData, {
      attempts: 3,   // retry up to 3 times
      backoff: 5000, // 5 seconds backoff
    });
  }
}