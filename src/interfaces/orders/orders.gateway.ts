// 📁 File: src/interfaces/orders/orders.gateway.ts

import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

// 🟢 DOMAIN EVENTS
import { OrderCreatedEvent } from '../../domains/orders/events/order-created.event';
import { OrderStatusUpdatedEvent } from '../../domains/orders/events/order-status-updated.event';

@WebSocketGateway({ namespace: 'orders' })
@Injectable()
export class OrdersGateway implements OnGatewayInit {
  @WebSocketServer()
  server!: Server;

  afterInit() {
    // Gateway initialized safely
  }

  /* =====================================================
     DOMAIN EVENT SUBSCRIPTIONS
  ===================================================== */

  @OnEvent(OrderCreatedEvent.name, { async: true })
  handleOrderCreated(event: OrderCreatedEvent) {
    if (!event?.order) return;

    this.server.emit('order.created', {
      order: event.order,
      timestamp: new Date().toISOString(),
    });
  }

  @OnEvent(OrderStatusUpdatedEvent.name, { async: true })
  handleOrderStatusUpdated(event: OrderStatusUpdatedEvent) {
    if (!event) return;

    this.server.emit('order.status.updated', {
      orderId: event.order.id,
      previousStatus: event.previousStatus,
      newStatus: event.newStatus,
      timestamp: new Date().toISOString(),
    });
  }

  /* =====================================================
     WEBSOCKET INBOUND EVENTS
  ===================================================== */

  @SubscribeMessage('ping')
  handlePing(client: any, payload: any) {
    client.emit('pong', {
      ...payload,
      serverTime: Date.now(),
    });
  }
}