// src/modules/business/infrastructure/schemas/business.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// ✅ Renamed from RestaurantDocument
export type BusinessDocument = Business & Document;

@Schema({ timestamps: true })
export class Business {
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

// ✅ Renamed from RestaurantSchema
export const BusinessSchema = SchemaFactory.createForClass(Business);