// src/modules/orders/orders.controller.ts
import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiProperty } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './schemas/order-status.enum';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

// ----------------------------
// Response DTOs for Swagger
// ----------------------------
class OrderItemResponseDto {
  @ApiProperty()
  product_id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  price!: number;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  total!: number;
}

class OrderResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  customer_name!: string;

  @ApiProperty()
  customer_phone!: string;

  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];

  @ApiProperty()
  total_amount!: number;

  @ApiProperty({ enum: OrderStatus })
  status!: OrderStatus;

  @ApiProperty()
  queue_number!: number;

  @ApiProperty({ required: false })
  notes!: string;
}

// ----------------------------
// Controller
// ----------------------------
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // --------------------------
  // Create a new order
  // --------------------------
  @Post(':restaurantId')
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
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
  @ApiResponse({ status: 200, description: 'Order status updated', type: OrderResponseDto })
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
  @ApiResponse({ status: 200, description: 'Order accepted', type: OrderResponseDto })
  accept(@Param('id') id: string) {
    return this.ordersService.acceptOrder(id);
  }

  @Patch(':id/preparing')
  @ApiResponse({ status: 200, description: 'Order started preparing', type: OrderResponseDto })
  preparing(@Param('id') id: string) {
    return this.ordersService.startPreparing(id);
  }

  @Patch(':id/ready')
  @ApiResponse({ status: 200, description: 'Order ready', type: OrderResponseDto })
  ready(@Param('id') id: string) {
    return this.ordersService.markReady(id);
  }

  @Patch(':id/complete')
  @ApiResponse({ status: 200, description: 'Order completed', type: OrderResponseDto })
  complete(@Param('id') id: string) {
    return this.ordersService.completeOrder(id);
  }

  @Patch(':id/cancel')
  @ApiResponse({ status: 200, description: 'Order cancelled', type: OrderResponseDto })
  cancel(@Param('id') id: string) {
    return this.ordersService.cancelOrder(id);
  }
}