// src/interfaces/notifications/notifications.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { CreateNotificationDto } from '../../application/notifications/dto/create-notification.dto';

@WebSocketGateway({ namespace: 'notifications' })
export class NotificationsGateway {
  @WebSocketServer() server!: Server;

  constructor() {}

  /**
   * ⚠️ PASS 2 RULE:
   * Gateway MUST NOT call use cases.
   *
   * It only broadcasts system state.
   */
  @SubscribeMessage('send_notification')
  async handleNotification(@MessageBody() dto: CreateNotificationDto) {
    // 🚫 No NotifyUseCase call anymore

    const event = {
      status: 'rejected',
      message: 'Notifications are event-driven only',
      dto,
    };

    this.server.emit('notification_status', event);

    return event;
  }
}