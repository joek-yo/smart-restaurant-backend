// 📁 Path: src/domains/menu/schemas/category.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true })
  name!: string; // ✅ non-null assertion

  // Multi-tenant: Business
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true, index: true })
  businessId!: Types.ObjectId; // ✅ non-null assertion

  // Multi-branch support (optional)
  @Prop({ type: Types.ObjectId, ref: 'Branch', required: false, index: true })
  branchId?: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean; // ✅ non-null assertion

  @Prop({ default: 0 })
  sortOrder!: number; // ✅ non-null assertion, camelCase consistent
}

export const CategorySchema = SchemaFactory.createForClass(Category);