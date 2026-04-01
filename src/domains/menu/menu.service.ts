// src/domains/menu/menu.service.ts

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

  /* =====================================================
     CATEGORY METHODS
  ===================================================== */

  async createCategory(businessId: string, dto: CreateCategoryDto) {
    const category = await this.categoryModel.create({
      ...dto,
      businessId: new Types.ObjectId(businessId),
    });

    this.eventBus.emit('category.created', { businessId, category });
    return category;
  }

  async findCategories(businessId: string) {
    return this.categoryModel
      .find({ businessId: new Types.ObjectId(businessId) })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();

    if (category) {
      this.eventBus.emit('category.updated', { id, dto });
    }

    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id).exec();

    if (category) {
      this.eventBus.emit('category.deleted', { id });
    }

    return category;
  }

  /* =====================================================
     PRODUCT METHODS
  ===================================================== */

  async createProduct(businessId: string, dto: CreateProductDto) {
    const stock = dto.stock ?? 0;

    const product = await this.productModel.create({
      ...dto,
      businessId: new Types.ObjectId(businessId),
      categoryId: new Types.ObjectId(dto.categoryId),
      stock,                      // store actual stock
      isOutOfStock: stock === 0,  // derive automatically
    });

    this.eventBus.emit('product.created', { businessId, product });
    return product;
  }

  async getProducts(businessId: string) {
    return this.productModel
      .find({ businessId: new Types.ObjectId(businessId) })
      .exec();
  }

  async getProductsByCategory(categoryId: string) {
    return this.productModel
      .find({ categoryId: new Types.ObjectId(categoryId) })
      .exec();
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const updates: Partial<ProductDocument> = {};

    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.price !== undefined) updates.price = dto.price;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.image !== undefined) updates.image = dto.image;
    if (dto.isAvailable !== undefined) updates.isAvailable = dto.isAvailable;

    // Convert categoryId string -> ObjectId
    if (dto.categoryId !== undefined)
      updates.categoryId = new Types.ObjectId(dto.categoryId);

    // Handle stock / isOutOfStock
    if (dto.stock !== undefined) {
      updates.stock = dto.stock;
      updates.isOutOfStock = dto.stock === 0;
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, { $set: updates }, { new: true })
      .exec();

    if (product) {
      this.eventBus.emit('product.updated', { id, dto: updates });
    }

    return product;
  }

  async deleteProduct(id: string) {
    const product = await this.productModel.findByIdAndDelete(id).exec();

    if (product) {
      this.eventBus.emit('product.deleted', { id });
    }

    return product;
  }

  /* =====================================================
     RESTAURANT SETTINGS METHODS
  ===================================================== */

  async getRestaurantSettings(
    businessId: string,
  ): Promise<RestaurantSettingsDocument | null> {
    return this.settingsModel.findOne({
      businessId: new Types.ObjectId(businessId),
    });
  }

  async upsertRestaurantSettings(
    businessId: string,
    data: Partial<RestaurantSettings>,
  ): Promise<RestaurantSettingsDocument> {
    const settings = await this.settingsModel.findOneAndUpdate(
      { businessId: new Types.ObjectId(businessId) },
      {
        $set: {
          ...data,
          businessId: new Types.ObjectId(businessId),
        },
      },
      { new: true, upsert: true },
    );

    this.eventBus.emit('restaurant.settings.updated', {
      businessId,
      settings,
    });

    return settings;
  }
}