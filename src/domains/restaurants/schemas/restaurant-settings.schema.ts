// src/modules/restaurants/schemas/restaurant-settings.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RestaurantSettingsDocument = RestaurantSettings & Document;

@Schema({ timestamps: true })
export class RestaurantSettings {

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, unique: true })
  businessId!: Types.ObjectId;

  // Multi-branch support
  @Prop({ type: Types.ObjectId, ref: 'Branch', required: false })
  branchId?: Types.ObjectId;

  @Prop({ default: '' })
  whatsappNumber!: string;

  @Prop({ default: '09:00' })
  openingTime!: string;

  @Prop({ default: '22:00' })
  closingTime!: string;

  @Prop({ default: 'KES' })
  currency!: string;

  @Prop({ default: 'Africa/Nairobi' })
  timezone!: string;

  @Prop({ default: true })
  autoAcceptOrders!: boolean;

  // Extra settings for future flexibility
  @Prop({ type: Object, default: {} })
  extraSettings!: Record<string, any>;
}

export const RestaurantSettingsSchema = SchemaFactory.createForClass(RestaurantSettings);