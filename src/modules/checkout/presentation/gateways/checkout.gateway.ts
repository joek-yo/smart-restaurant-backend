// src/modules/checkout/presentation/gateways/checkout.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { CheckoutOrchestratorService } from '../../application/orchestrators/checkout-orchestrator.service';

/**
 * CheckoutGateway
 * ----------------
 * PURE TRANSPORT LAYER ONLY
 *
 * Responsibilities:
 * - Receive websocket events
 * - Forward to orchestrator
 * - Return response to client
 *
 * ❌ NO business logic
 * ❌ NO event emission
 * ❌ NO state mutation
 */

@WebSocketGateway({
  cors: true,
})
export class CheckoutGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly orchestrator: CheckoutOrchestratorService,
  ) {}

  // ─────────────────────────────────────────────
  // 🛒 CART EVENTS
  // ─────────────────────────────────────────────

  @SubscribeMessage('cart:add')
  async handleAddItem(
    @MessageBody() payload: any,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.addToCart(payload);
  }

  @SubscribeMessage('cart:update')
  async handleUpdateQuantity(
    @MessageBody() payload: any,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.updateCartQuantity(
      payload,
      payload.productId,
      payload.quantity,
    );
  }

  @SubscribeMessage('cart:remove')
  async handleRemoveItem(
    @MessageBody() payload: any,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.removeFromCart(
      payload,
      payload.productId,
    );
  }

  // ─────────────────────────────────────────────
  // 💳 CHECKOUT FLOW
  // ─────────────────────────────────────────────

  @SubscribeMessage('checkout:start')
  async handleStartCheckout(
    @MessageBody() payload: any,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.startCheckout(payload);
  }

  @SubscribeMessage('checkout:confirm')
  async handleConfirmCheckout(
    @MessageBody() payload: any,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.confirmCheckout(payload);
  }

  @SubscribeMessage('checkout:cancel')
  async handleCancelCheckout(
    @MessageBody() payload: any,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.cancelCheckout(payload);
  }
}