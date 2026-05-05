// src/modules/orders/presentation/orders.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { TenantGuard } from '../../../core/tenant/tenant.guard';
import { CreateOrderFromSessionUseCase } from '../application/use-cases/create-order-from-session.usecase';
import { UpdateOrderStatusUseCase } from '../application/use-cases/update-order-status.usecase';
import { OrdersService } from '../orders.service';
import { OrderStatus } from '../domain/entities/order-status.enum';

@Controller('orders')
@UseGuards(TenantGuard)
export class OrdersController {
  constructor(
    private readonly createOrderUseCase: CreateOrderFromSessionUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() session: any) {
    // Inject tenantId from resolved tenant
    return this.createOrderUseCase.execute({
      ...session,
      tenantId: req.tenantId,
    });
  }

  @Get()
  async findAll(@Req() req: Request) {
    return this.ordersService.findAll(req.tenantId!);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.updateOrderStatusUseCase.execute(id, body.status);
  }
}
