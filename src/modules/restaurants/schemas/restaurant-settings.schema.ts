// src/modules/restaurants/schemas/restaurant-settings.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RestaurantSettingsDocument = RestaurantSettings & Document;

@Schema({ timestamps: true })
export class RestaurantSettings {

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, unique: true })
  restaurant_id!: Types.ObjectId;

  @Prop()
  whatsapp_number!: string;

  @Prop()
  opening_time!: string;

  @Prop()
  closing_time!: string;

  @Prop({ default: "KES" })
  currency!: string;

  @Prop({ default: "Africa/Nairobi" })
  timezone!: string;

  @Prop({ default: true })
  auto_accept_orders!: boolean;

}

export const RestaurantSettingsSchema =
  SchemaFactory.createForClass(RestaurantSettings);