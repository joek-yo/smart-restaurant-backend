// src/modules/orders/dto/update-order-status.dto.ts
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from '../../domain/entities/order-status.enum';

/** DTO for updating order status */
export class UpdateOrderStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    description: 'New status for the order',
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus; // Non-null assertion ensures TS2564 is resolved
}
