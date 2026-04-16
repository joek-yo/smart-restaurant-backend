// src/domains/menu/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  // Multi-tenant: Business
  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  businessId!: Types.ObjectId;

  // Multi-branch support (optional)
  @Prop({ type: Types.ObjectId, ref: 'Branch', required: false })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId!: Types.ObjectId;

  @Prop({ required: true })
  price!: number;

  @Prop()
  description?: string;

  @Prop()
  image?: string;

  @Prop({ default: true })
  isAvailable!: boolean; // ✅ camelCase consistent

  @Prop({ default: 0 })
  stock!: number;

  @Prop({ default: false })
  isOutOfStock!: boolean; // ✅ camelCase consistent
}

export const ProductSchema = SchemaFactory.createForClass(Product);