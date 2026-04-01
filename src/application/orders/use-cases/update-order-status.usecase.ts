// src/application/orders/use-cases/update-order-status.usecase.ts

import { Injectable, Inject } from '@nestjs/common';
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
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.status;
    order.updateStatus(newStatus);
    await this.orderRepo.update(orderId, order);

    this.eventBus.publish(new OrderStatusUpdatedEvent(order, previousStatus, newStatus));

    return order;
  }
}