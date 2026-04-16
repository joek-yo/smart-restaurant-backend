// 📁 Path: src/interfaces/menu/menu.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

import { EventBus } from '../../common/events/event-bus';
import { MenuItemCreatedEvent } from '../../domains/menu/events/menu-item-created.event';
import { MenuItemUpdatedEvent } from '../../domains/menu/events/menu-item-updated.event';

@Injectable()
@WebSocketGateway({
  namespace: '/menu',
  cors: { origin: '*' },
})
export class MenuGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server; // non-null assertion

  private readonly logger = new Logger(MenuGateway.name);

  constructor(private readonly eventBus: EventBus) {
    // Subscribe to domain events
    this.eventBus.subscribe(MenuItemCreatedEvent, (event: MenuItemCreatedEvent) =>
      this.handleMenuItemCreated(event),
    );
    this.eventBus.subscribe(MenuItemUpdatedEvent, (event: MenuItemUpdatedEvent) =>
      this.handleMenuItemUpdated(event),
    );
  }

  afterInit(server: Server) {
    this.logger.log('Menu WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /** Broadcast new menu item creation */
  private handleMenuItemCreated(event: MenuItemCreatedEvent) {
    this.server.emit('menu.item.created', event.menuItem);
    this.logger.log(`Broadcasted menu.item.created for ${event.menuItem.id}`);
  }

  /** Broadcast menu item updates */
  private handleMenuItemUpdated(event: MenuItemUpdatedEvent) {
    this.server.emit('menu.item.updated', event.menuItem);
    this.logger.log(`Broadcasted menu.item.updated for ${event.menuItem.id}`);
  }
}