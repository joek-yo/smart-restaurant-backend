// src/modules/orders/schemas/order.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../entities/order-status.enum';

export type OrderDocument = Order & Document;

/**
 * Embedded Order Item Snapshot
 * Stores frozen product data at order time
 */
@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId!: Types.ObjectId;

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
  // Multi-tenant: Business
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  businessId!: Types.ObjectId;

  // Multi-branch support (optional)
  @Prop({ type: Types.ObjectId, ref: 'Branch', required: false, index: true })
  branchId?: Types.ObjectId;

  // Link to Customer Engine
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId!: Types.ObjectId;

  // Snapshot customer info for independence
  @Prop({ required: true })
  customerName!: string;

  @Prop({ required: true })
  customerPhone!: string;

  // Order items snapshot
  @Prop({ type: [OrderItemSchema], required: true })
  items!: OrderItem[];

  @Prop({ required: true })
  totalAmount!: number;

  @Prop({ 
    type: String, 
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING
  })
  status!: OrderStatus;

  @Prop({ type: Number, required: true })
  queueNumber!: number;

  @Prop()
  notes?: string;

  // Optional: source of order
  @Prop({ type: String })
  source?: string; // e.g., WhatsApp, Link, Referral
}

export const OrderSchema = SchemaFactory.createForClass(Order);