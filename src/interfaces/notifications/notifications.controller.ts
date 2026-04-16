// src/interfaces/notifications/notifications.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { NotifyUseCase } from '../../application/notifications/use-cases/notify.usecase';
import { CreateNotificationDto } from '../../application/notifications/dto/create-notification.dto'; // fixed path

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifyUseCase: NotifyUseCase) {}

  // Manual trigger for testing
  @Post('send')
  async sendNotification(@Body() dto: CreateNotificationDto) {
    const result = await this.notifyUseCase.execute(dto);
    return {
      status: 'ok',
      result,
    };
  }
}