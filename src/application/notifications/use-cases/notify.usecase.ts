// src/application/notifications/use-cases/notify.usecase.ts

import { Injectable, Logger } from '@nestjs/common';
import { NotificationFactoryService } from '@modules/notifications/services/notification-factory.service';
import { NotificationQueueService } from '@modules/notifications/services/notification-queue.service';
import { MessagePayloadVO } from '@modules/notifications/value-objects/message-payload.vo';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { EventBus } from '../../../common/events/event-bus';

@Injectable()
export class NotifyUseCase {
  private readonly logger = new Logger(NotifyUseCase.name);

  constructor(
    private readonly factory: NotificationFactoryService,
    private readonly queue: NotificationQueueService,
    private readonly eventBus: EventBus,
  ) {}

  /**
   * ⚠️ PASS 2 CHANGE:
   * This no longer processes notifications directly.
   *
   * It ONLY emits an event.
   */
  async execute(dto: CreateNotificationDto): Promise<void> {
    this.logger.log(`Emitting notification.created event`);

    const businessId = 'example-business-id';

    const payloadVO = MessagePayloadVO.create({
      message: dto.message ?? '',
      title: dto.title,
      templateName: dto.templateName,
      templateParams: dto.templateParams,
    });

    const notification = this.factory.create({
      businessId,
      recipient: dto.recipient,
      channel: dto.channel,
      type: dto.type,
      payload: payloadVO,
    });

    // 🚀 PASS 2 CORE CHANGE: EVENT ONLY
    await this.eventBus.publish({
      name: 'notification.created',
      data: notification,
    } as any);

    this.logger.log(`notification.created event emitted`);
  }
}