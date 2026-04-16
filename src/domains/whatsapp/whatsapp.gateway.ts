// FILE: src/modules/whatsapp/whatsapp.gateway.ts

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SessionService } from '../sessions/services/session.service';
import { ProcessOrderUseCase } from './handlers/process-order';
import { SendReplyUseCase } from './handlers/send-reply';

interface ProductSnapshot {
  _id: string;
  name: string;
  quantity: number;
  price: number;
}

@WebSocketGateway()
export class WhatsappGateway {
  @WebSocketServer() server!: Server;

  constructor(
    private readonly sessionService: SessionService,
    private readonly processOrderUseCase: ProcessOrderUseCase,
    private readonly sendReplyUseCase: SendReplyUseCase,
  ) {}

  @SubscribeMessage('incomingMessage')
  async handleMessage(
    @MessageBody() payload: { phone: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { phone, message } = payload;

    // -----------------------------
    // CHECKOUT
    // -----------------------------
    if (message.toLowerCase() === 'checkout') {
      // ✅ Updated to clean signature: (phone)
      await this.sessionService.checkout(phone);

      await this.sendReplyUseCase.execute(
        phone,
        '✅ Your order is being processed!',
      );
      return;
    }

    // -----------------------------
    // ADD TO CART
    // -----------------------------
    if (message.startsWith('add ')) {
      const [_, quantityStr, ...productNameArr] = message.split(' ');
      const quantity = parseInt(quantityStr) || 1;
      const productName = productNameArr.join(' ');

      const product: ProductSnapshot = {
        _id: 'temp-id',
        name: productName,
        quantity,
        price: 0,
      };

      // ✅ Updated to clean signature: (phone, item)
      await this.sessionService.addItem(phone, product as any);

      await this.sendReplyUseCase.execute(
        phone,
        `✅ Added ${quantity} x ${productName} to your cart!`,
      );
      return;
    }

    // -----------------------------
    // SHOW CART
    // -----------------------------
    if (message.toLowerCase() === 'cart') {
      // ✅ Updated to clean signature: (phone)
      const session = await this.sessionService.getOrCreate(phone);

      const items = session.items || [];

      if (items.length === 0) {
        await this.sendReplyUseCase.execute(phone, '🛒 Your cart is empty.');
        return;
      }

      const cartMessage = items
        .map((i) => `${i.quantity} x ${i.name} = KES ${i.quantity * i.price}`)
        .join('\n');

      const total = session.totalAmount;

      await this.sendReplyUseCase.execute(
        phone,
        `🛒 Your cart:\n${cartMessage}\nTotal: KES ${total}`,
      );
      return;
    }

    // -----------------------------
    // DEFAULT
    // -----------------------------
    await this.sendReplyUseCase.execute(
      phone,
      '❌ Sorry, I did not understand that.',
    );
  }
}