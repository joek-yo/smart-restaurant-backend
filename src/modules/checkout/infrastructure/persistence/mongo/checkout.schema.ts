// src/modules/checkout/infrastructure/persistence/mongo/checkout.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CheckoutStatus } from '../../../domain/value-objects/checkout-status.vo';

/**
 * CHECKOUT PERSISTENCE SCHEMA
 * ---------------------------
 * This is the DATABASE representation only.
 * It must NOT contain business logic.
 */

@Schema({ timestamps: true })
export class CheckoutSchema extends Document {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ type: String, default: CheckoutStatus.CART_ACTIVE })
  status: CheckoutStatus;

  @Prop({
    type: [
      {
        productId: String,
        name: String,
        quantity: Number,
        price: Number,
        total: Number,
      },
    ],
    default: [],
  })
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;

  @Prop({ default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  tax: number;

  @Prop({ default: 0 })
  discount: number;

  @Prop({ default: 0 })
  total: number;

  @Prop({ default: null })
  lockedAt?: Date;
}

export const CheckoutModel = SchemaFactory.createForClass(CheckoutSchema);