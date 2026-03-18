// src/modules/menu/schemas/product.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {

  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant_id!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category_id!: Types.ObjectId;

  @Prop({ required: true })
  price!: number;

  @Prop()
  description!: string;

  @Prop()
  image!: string;

  @Prop({ default: true })
  is_available!: boolean;
}

export const ProductSchema =
  SchemaFactory.createForClass(Product);