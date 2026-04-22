// src/modules/orders/application/use-cases/update-order-status.usecase.ts

import { Injectable, Inject } from '@nestjs/common';

import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    order.updateStatus(status);

    return this.orderRepo.update(orderId, order);
  }
}