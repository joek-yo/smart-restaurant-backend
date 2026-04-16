// src/interfaces/notifications/notifications.module.ts

import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotifyUseCase } from '../../application/notifications/use-cases/notify.usecase';
import { NotificationBullModule } from '../../infrastructure/notifications/queue/bull/notification.module';
import { NotificationLoggerService } from '../../domains/notifications/services/notification-logger.service';
import { NotificationRepositoryImpl } from '../../infrastructure/notifications/database/mongoose/repositories/notification.repository.impl';

@Module({
  imports: [NotificationBullModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotifyUseCase,
    NotificationLoggerService,
    NotificationRepositoryImpl, // make sure this class is exported in the repo file
  ],
  exports: [NotificationRepositoryImpl], // optional: if other modules need it
})
export class NotificationsModule {}