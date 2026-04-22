// src/modules/orders/presentation/orders.controller.ts

import { Body, Controller, Post } from '@nestjs/common';
import { CreateOrderFromSessionUseCase } from '../application/use-cases/create-order-from-session.usecase';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderFromSessionUseCase,
  ) {}

  @Post()
  async create(@Body() session: any) {
    return this.createOrderUseCase.execute(session);
  }
}