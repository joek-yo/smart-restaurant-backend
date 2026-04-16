// src/interfaces/orders/orders.controller.ts
import { Body, Controller, Patch, Post, Param, Inject, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from '@domains/orders/dto/create-order.dto';
import { UpdateOrderStatusDto } from '@domains/orders/dto/update-order-status.dto';
import { CreateOrderUseCase } from '@application/orders/use-cases/create-order.usecase';
import { OrderRepository } from '@domains/orders/repositories/order.repository';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    @Inject('OrderRepository') private readonly orderRepo: OrderRepository,
  ) {}

  /** POST /orders — create new order */
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const businessId = 'default'; // replace with session/auth if needed
    return this.createOrderUseCase.execute(businessId, dto);
  }

  /** PATCH /orders/:id/status — update order status */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const previousStatus = order.status;
    order.updateStatus(dto.status);
    await this.orderRepo.update(orderId, order);

    return { orderId, previousStatus, newStatus: dto.status };
  }
}