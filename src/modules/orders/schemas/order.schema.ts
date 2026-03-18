// src/modules/orders/schemas/order.schema.ts
// Order Schema with item snapshot (critical for consistency)

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

/**
 * Embedded Order Item Snapshot
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

export const OrderItemSchema =
  SchemaFactory.createForClass(OrderItem);

/**
 * Main Order Schema
 */
@Schema({ timestamps: true })
export class Order {

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant_id!: Types.ObjectId;

  @Prop()
  customer_name!: string;

  @Prop()
  customer_phone!: string;

  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ required: true })
  total_amount!: number;

  @Prop({ default: 'pending' })
  status!: string;

  @Prop()
  notes?: string;

  @Prop()
  queue_number?: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);