// src/infrastructure/notifications/queue/bull/notification.processor.ts

import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationDispatcherService } from '../../../../domains/notifications/services/notification-dispatcher.service';
import { MessagePayloadVO } from '../../../../domains/notifications/value-objects/message-payload.vo';

@Processor('notification')
@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly dispatcher: NotificationDispatcherService) {}

  @Process('send_notification')
  async handleNotification(job: Job<MessagePayloadVO>) {
    const payload = job.data;
    try {
      this.logger.log(`Processing notification job: ${job.id}`);

      // Cast payload as any if NotificationDispatcherService expects Notification entity
      await this.dispatcher.dispatch(payload as any);

      this.logger.log(`Notification job ${job.id} completed successfully`);
    } catch (error) {
      // Proper logging
      this.logger.error(`Notification job ${job.id} failed`, (error as any).stack);
      throw error; // Let Bull handle retries
    }
  }
}