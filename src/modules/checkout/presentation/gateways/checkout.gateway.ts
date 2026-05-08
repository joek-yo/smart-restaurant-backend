// src/modules/checkout/presentation/gateways/checkout.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

/**
 * CHECKOUT GATEWAY
 * -----------------
 * ROLE:
 * Real-time transport adapter (WebSocket / WhatsApp bridge layer)
 *
 * RULES:
 * - NO business logic
 * - NO cart manipulation
 * - NO validation
 * - ONLY forwards to orchestrator
 */

@WebSocketGateway({
  cors: true,
})
export class CheckoutGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    // ⚠️ This should be CheckoutOrchestratorService
    private readonly orchestrator: any,
  ) {}

  // ==================================================
  // 🛒 CART EVENTS (REAL-TIME SYNC)
  // ==================================================

  @SubscribeMessage('cart:add')
  async handleAddItem(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.orchestrator.addItemToCart(payload);

    client.emit('cart:updated', result);

    return result;
  }

  @SubscribeMessage('cart:update')
  async handleUpdateQuantity(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.orchestrator.updateCartQuantity(payload);

    client.emit('cart:updated', result);

    return result;
  }

  @SubscribeMessage('cart:remove')
  async handleRemoveItem(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.orchestrator.removeItemFromCart(payload);

    client.emit('cart:updated', result);

    return result;
  }

  // ==================================================
  // 💳 CHECKOUT EVENTS
  // ==================================================

  @SubscribeMessage('checkout:start')
  async handleStartCheckout(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.orchestrator.startCheckout(payload);

    client.emit('checkout:started', result);

    return result;
  }

  @SubscribeMessage('checkout:confirm')
  async handleConfirmCheckout(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.orchestrator.confirmCheckout(payload);

    client.emit('checkout:confirmed', result);

    return result;
  }

  @SubscribeMessage('checkout:cancel')
  async handleCancelCheckout(
    @MessageBody() payload: any,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.orchestrator.cancelCheckout(payload);

    client.emit('checkout:cancelled', result);

    return result;
  }
}