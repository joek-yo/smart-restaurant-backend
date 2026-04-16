// src/interfaces/orders/orders.controller.ts

import { Body, Controller, Patch, Post, Param, Inject, forwardRef } from '@nestjs/common';
import { CreateOrderDto } from '../../domains/orders/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../domains/orders/dto/update-order-status.dto';
import { CreateOrderUseCase } from '../../application/orders/use-cases/create-order.usecase';
import { UpdateOrderStatusUseCase } from '../../application/orders/use-cases/update-order-status.usecase';

@Controller('orders')
export class OrdersController {
  constructor(
    @Inject(forwardRef(() => CreateOrderUseCase))
    private readonly createOrderUseCase: CreateOrderUseCase,
    
    // Inject the Use Case instead of calling the Repo directly
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
  ) {}

  /** POST /orders — create new order */
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const businessId = 'default'; 
    return this.createOrderUseCase.execute(businessId, dto);
  }

  /** PATCH /orders/:id/status — update order status */
  @Patch(':id/status')
  async updateStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    // 🚀 CLEAN ARCHITECTURE: Delegate finding, updating, and event publishing
    // The Use Case now handles the repo.update(orderId, order) call internally.
    const order = await this.updateOrderStatusUseCase.execute(
      orderId,
      dto.status,
    );

    return {
      orderId: order.id,
      newStatus: order.status,
    };
  }
}