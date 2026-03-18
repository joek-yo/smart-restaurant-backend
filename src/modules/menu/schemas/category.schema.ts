// src/modules/menu/schemas/category.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {

  @Prop({ required: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true, index: true })
  restaurant_id!: Types.ObjectId;

  @Prop({ default: true })
  is_active!: boolean;

  @Prop({ default: 0 })
  sort_order!: number;

}

export const CategorySchema = SchemaFactory.createForClass(Category);