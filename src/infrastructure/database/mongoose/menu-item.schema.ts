// 📁 Path: src/infrastructure/database/mongoose/menu-item.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { MenuItemStatus } from '../../../domains/menu/enums/menu-item-status.enum';

export type MenuItemDocument = MenuItemModel & Document;

@Schema({
  timestamps: true, // automatically adds createdAt & updatedAt
})
export class MenuItemModel {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0 })
  price!: number;

  @Prop({ required: true, index: true })
  categoryId!: string;

  @Prop({
    type: String,
    enum: Object.values(MenuItemStatus),
    default: MenuItemStatus.ACTIVE, // ✅ FIXED (was AVAILABLE)
  })
  status!: MenuItemStatus;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    default: [],
  })
  options!: {
    name: string;
    price: number;
  }[];
}

export const MenuItemSchema = SchemaFactory.createForClass(MenuItemModel);