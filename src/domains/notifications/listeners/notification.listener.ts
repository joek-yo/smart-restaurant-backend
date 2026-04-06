// src/domains/notifications/listeners/notification.listener.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs'; // only EventBus from CQRS
import { OnEvent } from '@nestjs/event-emitter'; // OnEvent from event-emitter
import { NotificationCreatedEvent } from '../events/notification-created.event';
import { NotifyUseCase } from '../../../application/notifications/use-cases/notify.usecase'; // fix relative path

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(private readonly notifyUseCase: NotifyUseCase) {}

  /**
   * Listen to NotificationCreatedEvent
   * Trigger the main use-case
   */
  @OnEvent('notification.created')
  async handleNotificationCreated(event: NotificationCreatedEvent) {
    this.logger.log(`Event received → NotificationCreatedEvent for ${event.notification.recipient}`);
    await this.notifyUseCase.execute(event.notification);
  }
}