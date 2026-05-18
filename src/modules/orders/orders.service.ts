// src/modules/orders/orders.service.ts

import { Injectable, Inject, NotFoundException } from '@nestjs/common';

import { ORDER_REPOSITORY } from './domain/repositories/order.tokens';
import { OrderRepository } from './domain/repositories/order.repository';
import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { CreateOrderDto } from './application/dto/create-order.dto';
import { EventBus } from '@core/events';
import { ORDER_EVENTS } from '@core/events/event.constants';
import { OrderStatus } from './domain/entities/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepo: OrderRepository,

    private readonly createOrderUseCase: CreateOrderUseCase,

    private readonly eventBus: EventBus,
  ) {}

  async create(dto: CreateOrderDto & { businessId: string }) {
    const tenantId = dto.businessId;

    const items = (dto.items ?? []).map((item) => ({
      productId: item.productId,
      name: item.name ?? item.productId,
      quantity: item.quantity,
      price: item.price ?? 0,
      total: (item.price ?? 0) * item.quantity,
    }));

    const totalAmount = items.reduce((sum, i) => sum + i.total, 0);
    const sessionId = `${tenantId}:${dto.customerId ?? 'guest'}:${Date.now()}`;

    const order = await this.createOrderUseCase.execute({
      tenantId,
      customerId: dto.customerId ?? 'guest',
      sessionId,
      items,
      totalAmount,
      customerName: dto.customerName,
      source: 'api',
    });

    this.eventBus.emit(ORDER_EVENTS.ORDER_CREATED, {
      orderId: order.id,
      businessId: tenantId,
    });

    return order;
  }

  async findAll(businessId: string) {
    return this.orderRepo.findByBusinessId(businessId);
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new NotFoundException(`Order ${id} not found`);
    return order;
  }

  async markAsCompleted(orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return null;
    const updated = await this.orderRepo.update(orderId, { status: OrderStatus.COMPLETED });
    this.eventBus.emit(ORDER_EVENTS.ORDER_COMPLETED, { orderId });
    return updated;
  }

  async cancelOrder(orderId: string) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) return null;
    const updated = await this.orderRepo.update(orderId, { status: OrderStatus.CANCELLED });
    this.eventBus.emit(ORDER_EVENTS.ORDER_CANCELLED, { orderId });
    return updated;
  }

  async updateStatus(id: string, dto: { status: OrderStatus }) {
    return this.orderRepo.update(id, { status: dto.status });
  }

  async remove(id: string) {
    await this.orderRepo.delete(id);
  }
}
