// src/infrastructure/notifications/queue/bull/notification.module.ts

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationQueue } from './notification.queue';
import { NotificationProcessor } from './notification.processor';
import { NotificationDispatcherService } from '../../../../domains/notifications/services/notification-dispatcher.service';

/**
 * NotificationBullModule
 *
 * 🔥 Queue module for handling async notifications
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification', // queue name
    }),
  ],
  providers: [
    NotificationQueue,
    NotificationProcessor,
    NotificationDispatcherService,
  ],
  exports: [NotificationQueue],
})
export class NotificationBullModule {}