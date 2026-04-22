// src/modules/business/infrastructure/business.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  // ✅ STEP 3 FIX: Standardized opening hours for multi-tenant business types
  @Prop({
    type: Object,
    default: { open: '09:00', close: '22:00' },
  })
  operatingHours!: {
    open: string;
    close: string;
  };

  // subscription becomes SaaS-level concept
  @Prop({ default: 'starter' })
  subscriptionPlan!: string;

  @Prop({ default: true })
  isActive!: boolean;

  // multi-location support (now generic for any business type)
  @Prop({ type: [Types.ObjectId], ref: 'Location', default: [] })
  locations!: Types.ObjectId[];

  // fully generic configuration system
  @Prop({ type: Object, default: {} })
  settings!: Record<string, any>;
}

export const BusinessSchema = SchemaFactory.createForClass(Business);