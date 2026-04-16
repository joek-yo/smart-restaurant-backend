// 📁 File: src/modules/whatsapp/handlers/process-order.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { SessionsService } from '../../sessions/sessions.service';

// ✅ FIXED PATH (application layer)
import { CreateOrderUseCase } from '../../../application/orders/use-cases/create-order.usecase';

import { ProductSnapshot } from '../../sessions/cart.service';

@Injectable()
export class ProcessOrderUseCase {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly createOrder: CreateOrderUseCase,
  ) {}

  /**
   * Process the order from a session
   */
  async execute(phone: string): Promise<string> {
    const session = this.sessionsService.getSession(phone);
    const cart = session.cart;

    if (!cart || cart.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    const items = cart.map((c) => ({
      productId: c.productId,
      quantity: c.quantity,
    }));

    await this.createOrder.execute(session.data.businessId, {
      customerName: session.phone,
      customerPhone: phone,
      items,
      notes: session.data.notes || '',
    });

    this.sessionsService.clearCart(phone);

    return `✅ Order successfully placed! Thank you.`;
  }
}