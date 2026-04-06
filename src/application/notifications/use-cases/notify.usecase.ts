// src/application/notifications/use-cases/notify.usecase.ts

import { Injectable, Logger } from '@nestjs/common';
import { NotificationFactoryService } from '../../../domains/notifications/services/notification-factory.service';
import { NotificationQueueService } from '../../../domains/notifications/services/notification-queue.service';
import { MessagePayloadVO } from '../../../domains/notifications/value-objects/message-payload.vo';
import { CreateNotificationDto } from '../dto/create-notification.dto';

@Injectable()
export class NotifyUseCase {
  private readonly logger = new Logger(NotifyUseCase.name);

  constructor(
    private readonly factory: NotificationFactoryService,
    private readonly queue: NotificationQueueService,
  ) {}

  /**
   * Map CreateNotificationDto → internal structure
   */
  async execute(dto: CreateNotificationDto): Promise<void> {
    // TODO: replace with real businessId logic
    const businessId = 'example-business-id';

    this.logger.log(`Mapping DTO for recipient ${dto.recipient}`);

    // 1️⃣ Build internal payload VO
    const payloadVO = MessagePayloadVO.create({
      message: dto.message ?? '',
      title: dto.title,
      templateName: dto.templateName,
      templateParams: dto.templateParams,
    });

    // 2️⃣ Create notification entity via factory
    const notification = this.factory.create({
      businessId,
      recipient: dto.recipient,
      channel: dto.channel,
      type: dto.type,
      payload: payloadVO,
    });

    // 3️⃣ Push to queue for async processing
    await this.queue.enqueue(notification);

    this.logger.log(
      `Notification queued for ${notification.recipient} [${notification.channel}]`,
    );
  }
}