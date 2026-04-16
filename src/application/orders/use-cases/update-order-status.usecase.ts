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
    // 1. Fetch the existing order
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const previousStatus = order.status;

    // 2. Apply domain logic (Update status on the entity)
    order.updateStatus(newStatus);

    // 3. Persist using the NEW (id, data) contract
    // This is now valid: (string, Order)
    await this.orderRepo.update(orderId, order);

    // 4. Publish event for side effects (WhatsApp, analytics, etc.)
    await this.eventBus.publish(
      new OrderStatusUpdatedEvent(order, previousStatus, newStatus)
    );

    return order;
  }
}