// src/domains/menu/schemas/product.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name!: string;

  // ── Tenant + branch scoping ────────────────────────────────────────────────
  @Prop({ type: Types.ObjectId, ref: 'Business', required: true, index: true })
  businessId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Branch', required: false })
  branchId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId!: Types.ObjectId;

  // ── Core product fields ────────────────────────────────────────────────────
  @Prop({ required: true })
  price!: number;

  // Original price before discount — null means no discount
  @Prop()
  oldPrice?: number;

  // Stored as integer percentage e.g. 15 means 15% off
  // Derived from oldPrice/price but stored for fast querying
  @Prop({ default: 0 })
  discountPercent!: number;

  @Prop()
  description?: string;

  @Prop()
  image?: string;

  // ── Inventory ──────────────────────────────────────────────────────────────
  @Prop({ default: true })
  isAvailable!: boolean;

  @Prop({ default: 0 })
  stock!: number;

  @Prop({ default: false })
  isOutOfStock!: boolean;

  // ── Merchandising flags ────────────────────────────────────────────────────
  // These are facts about the product, not UI config.
  // "Is this product featured?" is a product attribute, not a page preference.
  // Stored here so we can query: db.products.find({ businessId, featured: true })

  @Prop({ default: false })
  featured!: boolean;

  @Prop({ default: false })
  trending!: boolean;

  @Prop({ default: false })
  bestSelling!: boolean;

  // Marks product as a bundle (kit of multiple items)
  @Prop({ default: false })
  isBundle!: boolean;

  // Flash sale override — if true, shown in flash sale section regardless of discount
  @Prop({ default: false })
  onFlashSale!: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound index — all product queries will filter by businessId first
ProductSchema.index({ businessId: 1, isAvailable: 1 });
ProductSchema.index({ businessId: 1, featured: 1 });
ProductSchema.index({ businessId: 1, trending: 1 });
ProductSchema.index({ businessId: 1, bestSelling: 1 });
ProductSchema.index({ businessId: 1, onFlashSale: 1 });
ProductSchema.index({ businessId: 1, isBundle: 1 });