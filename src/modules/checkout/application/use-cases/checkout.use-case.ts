// src/modules/checkout/application/use-cases/checkout.use-case.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { SessionRepository } from '../../../sessions/domain/repositories/session.repository';
import { OrderRepository } from '../../../orders/domain/repositories/order.repository';
import { Order } from '../../../orders/domain/entities/order.entity';
import { OrderStatus } from '../../../orders/domain/entities/order-status.enum';

@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly sessionsRepository: SessionRepository,
    private readonly ordersRepository: OrderRepository,
  ) {}

  async execute(sessionId: string, customerId?: string) {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    if (session.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderItems = session.items.map((item: any) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
    }));

    const totalAmount = orderItems.reduce(
      (sum: number, item: any) => sum + item.total,
      0,
    );

    // 1. Create Order
    const order = await this.ordersRepository.create(new Order({
      customerId: customerId ?? session.userId,
      customerName: 'Guest',
      items: orderItems,
      totalAmount,
      status: OrderStatus.PENDING,
      tenantId: session.tenantId || session.businessId || 'default',
    }));

    // 2. Clear session cart after checkout
    session.items = [];
    await this.sessionsRepository.update(session.id!, session);

    return {
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      items: order.items,
    };
  }
}