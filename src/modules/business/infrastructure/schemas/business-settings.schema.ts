// src/modules/business/infrastructure/schemas/business-settings.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BusinessSettingsDocument = BusinessSettings & Document;

@Schema({ timestamps: true })
export class BusinessSettings {
  @Prop({
    type: Types.ObjectId,
    ref: 'Business',
    required: true,
    unique: true,
  })
  businessId!: Types.ObjectId;

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

  @Prop({ type: Object, default: {} })
  extraSettings!: Record<string, any>;
}

export const BusinessSettingsSchema =
  SchemaFactory.createForClass(BusinessSettings);