// src/modules/whatsapp/whatsapp.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SessionsService } from '../sessions/sessions.service';
import { AddToCartUseCase } from '../sessions/use-cases/add-to-cart';
import { CheckoutSessionUseCase } from '../sessions/use-cases/checkout-session';
import { ProcessOrderUseCase } from './handlers/process-order';
import { SendReplyUseCase } from './handlers/send-reply';

// Snapshot of a product for adding to cart
interface ProductSnapshot {
  _id: string;       // required by TypeScript
  name: string;
  quantity: number;
  price: number;     // ✅ now REQUIRED
}

// Cart item structure
interface CartItem {
  name: string;
  quantity: number;
  price: number;
}

@WebSocketGateway()
export class WhatsappGateway {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly checkoutSessionUseCase: CheckoutSessionUseCase,
    private readonly processOrderUseCase: ProcessOrderUseCase,
    private readonly sendReplyUseCase: SendReplyUseCase,
  ) {}

  @SubscribeMessage('incomingMessage')
  async handleMessage(
    @MessageBody() payload: { phone: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { phone, message } = payload;

    // Get session for this phone
    let session = this.sessionsService.getSession(phone);

    // -----------------------------
    // Handle checkout
    // -----------------------------
    if (message.toLowerCase() === 'checkout') {
      await this.checkoutSessionUseCase.execute(phone);
      await this.sendReplyUseCase.execute(phone, '✅ Your order is being processed!');
      return;
    }

    // -----------------------------
    // Handle add to cart
    // -----------------------------
    if (message.startsWith('add ')) {
      const [_, quantityStr, ...productNameArr] = message.split(' ');
      const quantity = parseInt(quantityStr) || 1;
      const productName = productNameArr.join(' ');

      // Temporary _id and price added to satisfy type
      const product: ProductSnapshot = {
        _id: 'temp-id',
        name: productName,
        quantity,
        price: 0, // ✅ required fix
      };

      await this.addToCartUseCase.execute(phone, product);

      await this.sendReplyUseCase.execute(
        phone,
        `✅ Added ${quantity} x ${productName} to your cart!`,
      );
      return;
    }

    // -----------------------------
    // Show cart
    // -----------------------------
    if (message.toLowerCase() === 'cart') {
      const cart: CartItem[] = session?.cart || [];
      if (cart.length === 0) {
        await this.sendReplyUseCase.execute(phone, '🛒 Your cart is empty.');
        return;
      }

      const cartMessage = cart
        .map((item) => `${item.quantity} x ${item.name} = KES ${item.quantity * item.price}`)
        .join('\n');

      const total = cart.reduce((sum, item) => sum + item.quantity * item.price, 0);
      await this.sendReplyUseCase.execute(phone, `🛒 Your cart:\n${cartMessage}\nTotal: KES ${total}`);
      return;
    }

    // -----------------------------
    // Default fallback
    // -----------------------------
    await this.sendReplyUseCase.execute(phone, '❌ Sorry, I did not understand that.');
  }
}