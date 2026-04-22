// src/modules/orders/infrastructure/controllers/orders.controller.ts

import { Body, Controller, Patch, Post, Param, Inject, NotFoundException } from '@nestjs/common';

// ✅ Updated to new @modules aliases
import { CreateOrderDto } from '@modules/orders/application/dto/create-order.dto';
import { UpdateOrderStatusDto } from '@modules/orders/application/dto/update-order-status.dto';
import { CreateOrderUseCase } from '@modules/orders/application/use-cases/create-order.usecase';
import { OrderRepository } from '@modules/orders/domain/repositories/order.repository';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    @Inject('OrderRepository') 
    private readonly orderRepo: OrderRepository,
  ) {}

  /** POST /orders — create new order */
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    // Note: Ensure your CreateOrderUseCase.execute matches the signature (dto) 
    // or (businessId, dto) based on your implementation
    return this.createOrderUseCase.execute(dto);
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
    
    // Domain logic remains on the entity
    order.updateStatus(dto.status);
    
    // Persist via updated repo
    await this.orderRepo.update(orderId, { status: dto.status });

    return { 
      orderId, 
      previousStatus, 
      newStatus: dto.status 
    };
  }
}