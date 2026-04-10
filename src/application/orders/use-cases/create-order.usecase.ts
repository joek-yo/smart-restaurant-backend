// src/application/orders/use-cases/create-order.usecase.ts

import { Injectable, Inject } from '@nestjs/common';
import { OrderRepository } from '../../../domains/orders/repositories/order.repository';
import { QueueNumberService } from '../../../domains/orders/services/queue-number.service';
import { EventBus } from '../../../common/events/event-bus';
import { OrderCreatedEvent } from '../../../domains/orders/events/order-created.event';
import { CreateOrderDto, CreateOrderItemDto } from '../../../domains/orders/dto/create-order.dto';
import { Order, OrderItem } from '../../../domains/orders/entities/order.entity';
import { OrderStatus } from '../../../domains/orders/entities/order-status.enum';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    @Inject('OrderRepository') private readonly orderRepo: OrderRepository,
    private readonly queueService: QueueNumberService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(businessId: string, dto: CreateOrderDto): Promise<Order> {
    const queueNumber = await this.queueService.generate(businessId);

    let totalAmount = 0;

    const orderItems: OrderItem[] = dto.items.map((item: CreateOrderItemDto) => {
      const name = item.name ?? 'Unknown';
      const price = item.price ?? 0;
      const total = price * item.quantity;

      totalAmount += total;

      return {
        productId: item.productId,
        name,
        price,
        quantity: item.quantity,
        total,
      };
    });

    const order = new Order({
      businessId,
      customerId: dto.customerId ?? '',
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      items: orderItems,
      totalAmount,
      status: OrderStatus.PENDING,
      queueNumber,
      notes: dto.notes ?? '',
    });

    const savedDoc = await this.orderRepo.create(order);

    const domainOrder = new Order({
      ...savedDoc,
      businessId: savedDoc.businessId?.toString(),
      customerId: savedDoc.customerId?.toString(),
      items: savedDoc.items?.map((i: OrderItem) => ({
        ...i,
        productId: i.productId?.toString(),
      })),
    });

    this.eventBus.publish(new OrderCreatedEvent(domainOrder));

    return domainOrder;
  }
}