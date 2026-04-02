// 📁 Path: src/infrastructure/database/mongoose/category.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { CategoryStatus } from '../../../domains/menu/enums/category-status.enum';

export type CategoryDocument = CategoryModel & Document;

@Schema({
  timestamps: true, // auto createdAt & updatedAt
})
export class CategoryModel {
  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, index: true })
  businessId!: string;

  @Prop({
    type: String,
    enum: Object.values(CategoryStatus),
    default: CategoryStatus.ACTIVE,
  })
  status!: CategoryStatus;
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);