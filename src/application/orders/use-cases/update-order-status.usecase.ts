// src/application/orders/use-cases/update-order-status.usecase.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { OrderRepository } from '../../../domains/orders/repositories/order.repository';
import { EventBus } from '../../../common/events/event-bus';
import { OrderStatusUpdatedEvent } from '../../../domains/orders/events/order-status-updated.event';
import { OrderStatus } from '../../../domains/orders/entities/order-status.enum';

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepo: OrderRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(orderId: string, newStatus: OrderStatus) {
    // 1. Fetch order
    const order = await this.orderRepo.findById(orderId);

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const previousStatus = order.status;

    // 2. Apply domain logic (entity behavior stays valid)
    order.updateStatus(newStatus);

    // 3. Persist ONLY what changed (NOT full entity)
    const updatedOrder = await this.orderRepo.update(orderId, {
      status: order.status,
    });

    // 4. Publish event
    await this.eventBus.publish(
      new OrderStatusUpdatedEvent(
        updatedOrder,
        previousStatus,
        newStatus
      )
    );

    // 5. Return API-safe response
    return {
      orderId: updatedOrder.id,
      previousStatus,
      newStatus: updatedOrder.status,
    };
  }
}