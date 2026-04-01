// src/modules/whatsapp/handlers/handle-incoming-message.ts
import { Injectable } from '@nestjs/common';
import { SessionsService } from '../../sessions/sessions.service';
import { ProcessOrderUseCase } from './process-order';
import { SendReplyUseCase } from './send-reply';

@Injectable()
export class HandleIncomingMessageUseCase {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly processOrder: ProcessOrderUseCase,
    private readonly sendReply: SendReplyUseCase,
  ) {}

  /**
   * Handle incoming WhatsApp message
   * Determines current session step and delegates action
   */
  async execute(phone: string, message: string) {
    const session = this.sessionsService.getSession(phone);

    switch (session.step) {
      case 'start':
        this.sessionsService.setStep(phone, 'category_selected');
        return this.sendReply.execute(phone, 'Welcome! Please select a category:');

      case 'category_selected':
        this.sessionsService.setCategory(phone, message);
        this.sessionsService.setStep(phone, 'product_selected');
        return this.sendReply.execute(phone, 'Category selected. Pick a product:');

      case 'product_selected':
        this.sessionsService.setProduct(phone, message);
        this.sessionsService.setStep(phone, 'quantity');
        return this.sendReply.execute(phone, 'Product selected. How many do you want?');

      case 'quantity':
        this.sessionsService.setData(phone, 'quantity', parseInt(message, 10));
        this.sessionsService.setStep(phone, 'checkout');
        return this.sendReply.execute(phone, 'Quantity saved. Type "checkout" to complete order.');

      case 'checkout':
        if (message.toLowerCase() === 'checkout') {
          const confirmation = await this.processOrder.execute(phone);
          this.sessionsService.resetSession(phone);
          return this.sendReply.execute(phone, confirmation);
        }
        return this.sendReply.execute(phone, 'Unknown input. Type "checkout" to finish.');

      default:
        this.sessionsService.resetSession(phone);
        return this.sendReply.execute(phone, 'Session reset. Start again by typing anything.');
    }
  }
}