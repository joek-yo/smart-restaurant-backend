// src/modules/menu/menu.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Category, CategoryDocument } from './schemas/category.schema';
import { Product, ProductDocument } from './schemas/product.schema';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  /* =====================================================
     CATEGORY METHODS
  ===================================================== */

  async createCategory(
    restaurantId: string,
    dto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryModel.create({
      ...dto,
      restaurant_id: new Types.ObjectId(restaurantId),
    });
  }

  async findCategories(
    restaurantId: string,
  ): Promise<Category[]> {
    return this.categoryModel
      .find({ restaurant_id: new Types.ObjectId(restaurantId) })
      .sort({ sort_order: 1 })
      .exec();
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<Category | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
  }

  async deleteCategory(
    id: string,
  ): Promise<Category | null> {
    return this.categoryModel
      .findByIdAndDelete(id)
      .exec();
  }

  /* =====================================================
     PRODUCT METHODS
  ===================================================== */

  async createProduct(
    restaurantId: string,
    dto: CreateProductDto,
  ): Promise<Product> {
    return this.productModel.create({
      ...dto,
      restaurant_id: new Types.ObjectId(restaurantId),
      category_id: new Types.ObjectId(dto.category_id),
    });
  }

  /**
   * Get ONLY available products for restaurant
   */
  async findProducts(
    restaurantId: string,
  ): Promise<Product[]> {
    return this.productModel
      .find({
        restaurant_id: new Types.ObjectId(restaurantId),
        is_available: true,
        is_out_of_stock: false,
      })
      .sort({ sort_order: 1 })
      .exec();
  }

  /**
   * ✅ FIXED: Reliable product update (stock included)
   */
  async updateProduct(
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product | null> {
    const product = await this.productModel.findById(id);

    if (!product) return null;

    // Handle ObjectId conversion
    if (dto.category_id) {
      product.category_id = new Types.ObjectId(dto.category_id);
    }

    // 🔥 Manual field updates (guaranteed to work)
    if (dto.name !== undefined) {
      product.name = dto.name;
    }

    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.is_available !== undefined) {
      product.is_available = dto.is_available;
    }

    if (dto.stock !== undefined) {
      product.stock = dto.stock;
    }

    if (dto.is_out_of_stock !== undefined) {
      product.is_out_of_stock = dto.is_out_of_stock;
    }

    return product.save();
  }

  async deleteProduct(
    id: string,
  ): Promise<Product | null> {
    return this.productModel
      .findByIdAndDelete(id)
      .exec();
  }

  /**
   * Toggle product availability
   */
  async toggleProductAvailability(
    id: string,
  ): Promise<Product | null> {
    const product = await this.productModel.findById(id);

    if (!product) {
      return null;
    }

    product.is_available = !product.is_available;

    return product.save();
  }
}