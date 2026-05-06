// src/domains/menu/schemas/catalog-settings.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CatalogSettingsDocument = CatalogSettings & Document;

@Schema({ timestamps: true })
export class CatalogSettings {
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, unique: true })
  businessId!: Types.ObjectId;

  @Prop({ default: '08:00' })
  openingTime!: string; // ✅ camelCase

  @Prop({ default: '22:00' })
  closingTime!: string; // ✅ camelCase

  @Prop({ default: true })
  isOpen!: boolean; // ✅ camelCase
}

export const CatalogSettingsSchema =
  SchemaFactory.createForClass(CatalogSettings);