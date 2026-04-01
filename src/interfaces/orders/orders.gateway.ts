// 📁 File: src/interfaces/orders/orders.gateway.ts

import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';

// ❌ remove @common alias
import { EventBus } from '../../common/events/event-bus';

// ❌ remove @domains alias
import { OrderCreatedEvent } from '../../domains/orders/events/order-created.event';
import { OrderStatusUpdatedEvent } from '../../domains/orders/events/order-status-updated.event';

@WebSocketGateway({ namespace: 'orders' })
@Injectable()
export class OrdersGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly eventBus: EventBus) {}

  afterInit() {
    // ✅ Subscribe to events
    this.eventBus.on('OrderCreatedEvent', (event: OrderCreatedEvent) => {
      this.server.emit('order.created', event.order);
    });

    this.eventBus.on('OrderStatusUpdatedEvent', (event: OrderStatusUpdatedEvent) => {
      this.server.emit('order.status.updated', {
        orderId: event.order.id,
        previousStatus: event.previousStatus,
        newStatus: event.newStatus,
      });
    });
  }

  /** Example: handle incoming WS message */
  @SubscribeMessage('ping')
  handlePing(client: any, payload: any) {
    client.emit('pong', payload);
  }
}