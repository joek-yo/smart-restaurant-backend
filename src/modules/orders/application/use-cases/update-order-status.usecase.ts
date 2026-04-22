// src/modules/orders/application/use-cases/update-order-status.usecase.ts

import { Injectable, Inject } from '@nestjs/common';

import { ORDER_REPOSITORY } from '@modules/orders/domain/repositories/order.tokens';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';
import { Order } from '@modules/orders/domain/entities/order.entity';
import { OrderStatus } from '@modules/orders/domain/entities/order-status.enum';

// 🔥 EVENT BUS
import { EventBus, EVENTS } from '@core/events';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,

    // ✅ ADD EVENT BUS
    private readonly eventBus: EventBus,
  ) {}

  async execute(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // ✅ update domain
    order.updateStatus(status);

    const updated = await this.orderRepo.update(orderId, order);

    // 🔥 EMIT EVENTS BASED ON STATUS
    if (status === OrderStatus.COMPLETED) {
      this.eventBus.emit(EVENTS.ORDER_COMPLETED, {
        orderId,
        businessId: order.businessId,
      });
    }

    if (status === OrderStatus.CANCELLED) {
      this.eventBus.emit(EVENTS.ORDER_CANCELLED, {
        orderId,
        businessId: order.businessId,
      });
    }

    return updated;
  }
}