// src/interfaces/notifications/notifications.gateway.ts

import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotifyUseCase } from '../../application/notifications/use-cases/notify.usecase';
import { CreateNotificationDto } from '../../application/notifications/dto/create-notification.dto'; // fixed path

@WebSocketGateway({ namespace: 'notifications' })
export class NotificationsGateway {
  @WebSocketServer() server!: Server; // definite assignment

  constructor(private readonly notifyUseCase: NotifyUseCase) {}

  @SubscribeMessage('send_notification')
  async handleNotification(@MessageBody() dto: CreateNotificationDto) {
    const result = await this.notifyUseCase.execute(dto);
    // Broadcast to all connected clients
    this.server.emit('notification_status', result);
    return result;
  }
}