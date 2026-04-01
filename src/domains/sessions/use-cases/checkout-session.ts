// src/modules/sessions/use-cases/checkout-session.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { SessionsService } from '../sessions.service';

@Injectable()
export class CheckoutSessionUseCase {
  constructor(private readonly sessionsService: SessionsService) {}

  execute(phone: string) {
    const session = this.sessionsService.getSession(phone);

    if (!session.cart.length) {
      throw new BadRequestException('Cart is empty');
    }

    // Prepare order payload (DO NOT create order here)
    const orderPayload = {
      customerPhone: phone,
      items: session.cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      totalAmount: session.cart.reduce(
        (sum, item) => sum + item.price * item.quantity, // ✅ fixed
        0,
      ),
    };

    // Move session to checkout step
    this.sessionsService.setStep(phone, 'checkout');

    return {
      message: 'Ready for checkout',
      order: orderPayload,
    };
  }
}