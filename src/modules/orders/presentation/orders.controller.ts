// src/modules/orders/presentation/orders.controller.ts

import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { TenantGuard } from '../../../core/tenant/tenant.guard';
import { UpdateOrderStatusUseCase } from '../application/use-cases/update-order-status.usecase';
import { OrdersService } from '../orders.service';
import { OrderStatus } from '../domain/entities/order-status.enum';
import { CreateOrderDto } from '../application/dto/create-order.dto';

/**
 * OrdersController
 * -----------------
 * Handles direct/admin order creation and lifecycle management.
 *
 * NOTE: Orders created via checkout flow go through:
 * CheckoutOrchestratorService → CreateOrderFromCheckoutUseCase
 * This controller is for direct API / admin order creation only.
 */
@Controller('orders')
@UseGuards(TenantGuard)
export class OrdersController {
  constructor(
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly ordersService: OrdersService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Body() dto: CreateOrderDto) {
    return this.ordersService.create({
      ...dto,
      businessId: req.tenantId ?? dto.businessId,
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