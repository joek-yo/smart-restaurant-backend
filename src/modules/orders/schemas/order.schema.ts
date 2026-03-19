// src/modules/orders/schemas/order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from './order-status.enum';

export type OrderDocument = Order & Document;

/**
 * Embedded Order Item Snapshot
 * Stores frozen product data at order time
 */
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product_id!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ required: true })
  quantity!: number;

  @Prop({ required: true })
  total!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

/**
 * Main Order Schema
 */
@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant_id!: Types.ObjectId;

  @Prop({ required: true })
  customer_name!: string;

  @Prop({ required: true })
  customer_phone!: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ required: true })
  total_amount!: number;

  @Prop({ 
    type: String, 
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  })
  status!: OrderStatus;

  @Prop({ type: Number, required: true })
  queue_number!: number; // dynamic queue number

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);