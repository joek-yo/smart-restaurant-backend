// 📁 File: src/domains/menu/catalog.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Category, CategoryDocument } from '../infrastructure/schemas/category.schema';
import { Product, ProductDocument } from '../infrastructure/schemas/product.schema';
import {
  CatalogSettings,
  CatalogSettingsDocument,
} from '../infrastructure/schemas/catalog-settings.schema';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

// ✅ Core Event Bus (NEW ARCHITECTURE)
import { EventBus } from '@core/events';

@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(CatalogSettings.name)
    private readonly settingsModel: Model<CatalogSettingsDocument>,

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

    this.eventBus.emit('category.created', {
      category: category.toObject(),
      businessId,
    });

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
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after' })
      .exec();

    if (!category) return null;

    this.eventBus.emit('category.updated', {
      category: category.toObject(),
    });

    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!category) return null;

    this.eventBus.emit('category.deleted', { id });

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

    this.eventBus.emit('product.created', {
      product: product.toObject(),
      businessId,
    });

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
    const updates: any = { ...dto };

    if (dto.categoryId) {
      updates.categoryId = new Types.ObjectId(dto.categoryId);
    }

    if (dto.stock !== undefined) {
      updates.isOutOfStock = dto.stock === 0;
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after' })
      .exec();

    if (!product) return null;

    this.eventBus.emit('product.updated', {
      product: product.toObject(),
      id,
    });

    return product;
  }

  async deleteProduct(id: string) {
    const product = await this.productModel.findByIdAndDelete(id).exec();
    if (!product) return null;

    this.eventBus.emit('product.deleted', { id });

    return product;
  }

  /* =====================================================
     SETTINGS METHODS
  ===================================================== */

  async getCatalogSettings(businessId: string) {
    return this.settingsModel.findOne(this.toBusinessFilter(businessId));
  }

  async upsertCatalogSettings(
    businessId: string,
    data: Partial<CatalogSettings>,
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
        returnDocument: 'after',
        upsert: true,
      },
    );

    if (!settings) return null;

    this.eventBus.emit('restaurant.settings.updated', {
      settings: settings.toObject(),
      businessId,
    });

    return settings;
  }
}