// src/modules/checkout/presentation/gateways/checkout.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { CheckoutOrchestratorService, CommerceContext } from '../../application/orchestrators/checkout-orchestrator.service';

interface CartAddPayload extends CommerceContext {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartUpdatePayload extends CommerceContext {
  productId: string;
  quantity: number;
}

interface CartRemovePayload extends CommerceContext {
  productId: string;
}

/**
 * CheckoutGateway
 * ----------------
 * PURE TRANSPORT LAYER ONLY
 * ❌ NO business logic
 * ❌ NO event emission
 * ❌ NO state mutation
 */
@WebSocketGateway({ cors: true })
export class CheckoutGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly orchestrator: CheckoutOrchestratorService) {}

  @SubscribeMessage('cart:add')
  async handleAddItem(
    @MessageBody() payload: CartAddPayload,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.addToCart(payload, {
      productId: payload.productId,
      name: payload.name,
      price: payload.price,
      quantity: payload.quantity,
    });
  }

  @SubscribeMessage('cart:update')
  async handleUpdateQuantity(
    @MessageBody() payload: CartUpdatePayload,
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
    @MessageBody() payload: CartRemovePayload,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.removeFromCart(payload, payload.productId);
  }

  @SubscribeMessage('checkout:start')
  async handleStartCheckout(
    @MessageBody() payload: CommerceContext,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.startCheckout(payload);
  }

  @SubscribeMessage('checkout:confirm')
  async handleConfirmCheckout(
    @MessageBody() payload: CommerceContext,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.confirmCheckout(payload);
  }

  @SubscribeMessage('checkout:cancel')
  async handleCancelCheckout(
    @MessageBody() payload: CommerceContext,
    @ConnectedSocket() _client: Socket,
  ) {
    return this.orchestrator.cancelCheckout(payload);
  }
}