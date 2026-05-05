// src/modules/whatsapp/gateway/whatsapp.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SessionService } from '../../../modules/sessions/application/services/session.service';
import { ProcessOrderUseCase } from '../handlers/process-order';
import { SendReplyUseCase } from '../handlers/send-reply';
import { CartItemEntity } from '../../../modules/sessions/domain/entities/cart-item.entity';

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
    @ConnectedSocket() _client: Socket,
  ) {
    const { phone, message } = payload;

    if (message.toLowerCase() === 'checkout') {
      await this.sessionService.checkout(phone);
      return this.sendReplyUseCase.execute(phone, '✅ Your order is being processed!');
    }

    if (message.startsWith('add ')) {
      const [, quantityStr, ...productNameArr] = message.split(' ');
      const quantity = parseInt(quantityStr) || 1;
      const productName = productNameArr.join(' ');

      const item = new CartItemEntity({
        productId: 'temp-id',
        name: productName,
        quantity,
        price: 0,
        sessionId: phone,
        businessId: 'default',
      });

      await this.sessionService.addItem(phone, item);
      return this.sendReplyUseCase.execute(phone, `✅ Added ${quantity} x ${productName} to your cart!`);
    }

    if (message.toLowerCase() === 'cart') {
      const session = await this.sessionService.getOrCreate(phone);
      const items = session.items || [];

      if (items.length === 0) {
        return this.sendReplyUseCase.execute(phone, '🛒 Your cart is empty.');
      }

      const cartMessage = items
        .map((i) => `${i.quantity} x ${i.name} = KES ${i.quantity * i.price}`)
        .join('\n');

      return this.sendReplyUseCase.execute(phone, `🛒 Your cart:\n${cartMessage}\nTotal: KES ${session.totalAmount}`);
    }

    return this.sendReplyUseCase.execute(phone, '❌ Sorry, I did not understand that.');
  }
}
