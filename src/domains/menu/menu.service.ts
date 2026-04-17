// 📁 File: src/domains/menu/menu.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import {
  RestaurantSettings,
  RestaurantSettingsDocument,
} from './schemas/restaurant-settings.schema';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { EventBus } from '../../common/events/event-bus';

// 🟢 DOMAIN EVENTS
import { CategoryCreatedEvent } from './events/category-created.event';
import { CategoryUpdatedEvent } from './events/category-updated.event';
import { CategoryDeletedEvent } from './events/category-deleted.event';
import { ProductCreatedEvent } from './events/product-created.event';
import { ProductUpdatedEvent } from './events/product-updated.event';
import { ProductDeletedEvent } from './events/product-deleted.event';
import { RestaurantSettingsUpdatedEvent } from './events/restaurant-settings-updated.event';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(RestaurantSettings.name)
    private readonly settingsModel: Model<RestaurantSettingsDocument>,
    private readonly eventBus: EventBus,
  ) {}

  private toBusinessFilter(businessId: string) {
    return Types.ObjectId.isValid(businessId)
      ? { businessId: new Types.ObjectId(businessId) }
      : { businessId };
  }

  /* =====================================================
     CATEGORY METHODS
  ===================================================== */

  async createCategory(businessId: string, dto: CreateCategoryDto) {
    const category = await this.categoryModel.create({
      ...dto,
      businessId: Types.ObjectId.isValid(businessId)
        ? new Types.ObjectId(businessId)
        : businessId,
    });

    this.eventBus.publish(
      new CategoryCreatedEvent(category.toObject(), businessId),
    );

    return category;
  }

  async findCategories(businessId: string) {
    return this.categoryModel
      .find(this.toBusinessFilter(businessId))
      .sort({ sortOrder: 1 })
      .exec();
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel
      .findByIdAndUpdate(
        id,
        { $set: dto },
        { returnDocument: 'after' }, // ✅ FIX
      )
      .exec();

    if (!category) return null;

    this.eventBus.publish(
      new CategoryUpdatedEvent(category.toObject()),
    );

    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!category) return null;

    this.eventBus.publish(new CategoryDeletedEvent(id));
    return category;
  }

  /* =====================================================
     PRODUCT METHODS
  ===================================================== */

  async createProduct(businessId: string, dto: CreateProductDto) {
    const stock = dto.stock ?? 0;

    const product = await this.productModel.create({
      ...dto,
      businessId: Types.ObjectId.isValid(businessId)
        ? new Types.ObjectId(businessId)
        : businessId,
      categoryId: new Types.ObjectId(dto.categoryId),
      stock,
      isOutOfStock: stock === 0,
    });

    this.eventBus.publish(
      new ProductCreatedEvent(product.toObject(), businessId),
    );

    return product;
  }

  async getProducts(businessId: string) {
    return this.productModel.find(this.toBusinessFilter(businessId)).exec();
  }

  async getProductsByCategory(categoryId: string) {
    return this.productModel
      .find({ categoryId: new Types.ObjectId(categoryId) })
      .exec();
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const updates: Partial<ProductDocument> = { ...dto } as any;

    if (dto.categoryId) {
      updates.categoryId = new Types.ObjectId(dto.categoryId) as any;
    }

    if (dto.stock !== undefined) {
      updates.isOutOfStock = dto.stock === 0;
    }

    const product = await this.productModel
      .findByIdAndUpdate(
        id,
        { $set: updates },
        { returnDocument: 'after' }, // ✅ FIX
      )
      .exec();

    if (!product) return null;

    this.eventBus.publish(
      new ProductUpdatedEvent(product.toObject(), id),
    );

    return product;
  }

  async deleteProduct(id: string) {
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) return null;

    this.eventBus.publish(new ProductDeletedEvent(id));
    return product;
  }

  /* =====================================================
     SETTINGS METHODS
  ===================================================== */

  async getRestaurantSettings(businessId: string) {
    return this.settingsModel.findOne(this.toBusinessFilter(businessId));
  }

  async upsertRestaurantSettings(
    businessId: string,
    data: Partial<RestaurantSettings>,
  ) {
    const settings = await this.settingsModel.findOneAndUpdate(
      this.toBusinessFilter(businessId),
      {
        $set: {
          ...data,
          businessId: Types.ObjectId.isValid(businessId)
            ? new Types.ObjectId(businessId)
            : businessId,
        },
      },
      {
        returnDocument: 'after', // ✅ FIX
        upsert: true,
      },
    );

    if (!settings) return null;

    this.eventBus.publish(
      new RestaurantSettingsUpdatedEvent(settings.toObject(), businessId),
    );

    return settings;
  }
}