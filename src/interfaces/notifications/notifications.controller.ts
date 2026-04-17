// src/interfaces/notifications/notifications.controller.ts

import { Controller, Post, Body } from '@nestjs/common';
import { CreateNotificationDto } from '../../application/notifications/dto/create-notification.dto';

/**
 * ⚠️ PASS 2 ARCHITECTURE CHANGE:
 * This controller is now INTERNAL DEBUG ONLY.
 * It does NOT execute business logic.
 *
 * Real notifications must come from EVENTS.
 */
@Controller('notifications')
export class NotificationsController {
  constructor() {}

  // 🧪 Debug endpoint only (no use-case call)
  @Post('send')
  async sendNotification(@Body() dto: CreateNotificationDto) {
    return {
      status: 'disabled_in_event_mode',
      message: 'Use event system: notification.created',
      received: dto,
    };
  }
}