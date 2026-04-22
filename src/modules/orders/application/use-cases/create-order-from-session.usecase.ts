import { Injectable, Inject } from '@nestjs/common';

import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';

@Injectable()
export class CreateOrderFromSessionUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,
  ) {}

  async execute(session: any): Promise<Order> {
    // 1. Build domain entity
    const order = Order.fromSession(session);

    // 2. Assign queue number (simple fallback logic)
    order.queueNumber = Date.now();

    // 3. Persist via repository abstraction
    return this.orderRepo.create(order);
  }
}