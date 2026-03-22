// src/modules/orders/orders.controller.ts
import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --------------------------
  // Create a new order
  // --------------------------
  @Post(':restaurantId')
  createOrder(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(restaurantId, dto);
  }

  // --------------------------
  // Update order status (generic)
  // --------------------------
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateDto.status);
  }

  // --------------------------
  // Convenience endpoints
  // --------------------------
  @Patch(':id/accept')
  accept(@Param('id') id: string) {
    return this.ordersService.acceptOrder(id);
  }

  @Patch(':id/preparing')
  preparing(@Param('id') id: string) {
    return this.ordersService.startPreparing(id);
  }

  @Patch(':id/ready')
  ready(@Param('id') id: string) {
    return this.ordersService.markReady(id);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string) {
    return this.ordersService.completeOrder(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}