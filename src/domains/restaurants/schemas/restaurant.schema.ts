// src/modules/restaurants/schemas/restaurant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RestaurantDocument = Restaurant & Document;

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true, unique: true })
  email!: string;

  @Prop()
  address?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ required: true })
  timezone!: string;

  @Prop({ required: true })
  currency!: string;

  @Prop({
    type: Object,
    default: { open: '09:00', close: '22:00' },
  })
  businessHours!: {
    open: string;
    close: string;
  };

  @Prop({ default: 'starter' })
  subscriptionPlan!: string;

  @Prop({ default: true })
  isActive!: boolean;

  // Multi-branch support
  @Prop({ type: [Types.ObjectId], ref: 'Branch', default: [] })
  branches!: Types.ObjectId[];

  // Extra settings for future engines
  @Prop({
    type: Object,
    default: {},
  })
  settings!: Record<string, any>;
}

export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);