// src/modules/menu/menu.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { MenuService } from './menu.service';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller()
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /* =====================================================
     CATEGORY ROUTES
  ===================================================== */

  // Create category
  @Post('categories/:restaurantId')
  createCategory(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.menuService.createCategory(restaurantId, dto);
  }

  // Get categories for a restaurant
  @Get('categories/:restaurantId')
  findCategories(
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.menuService.findCategories(restaurantId);
  }

  // Update category
  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.menuService.updateCategory(id, dto);
  }

  // Delete category
  @Delete('categories/:id')
  deleteCategory(
    @Param('id') id: string,
  ) {
    return this.menuService.deleteCategory(id);
  }

  /* =====================================================
     PRODUCT ROUTES
  ===================================================== */

  // Create product
  @Post('products/:restaurantId')
  createProduct(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.menuService.createProduct(restaurantId, dto);
  }

  // Get products for restaurant
  @Get('products/:restaurantId')
  findProducts(
    @Param('restaurantId') restaurantId: string,
  ) {
    return this.menuService.findProducts(restaurantId);
  }

  // Update product
  @Patch('products/:id')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.menuService.updateProduct(id, dto);
  }

  // Delete product
  @Delete('products/:id')
  deleteProduct(
    @Param('id') id: string,
  ) {
    return this.menuService.deleteProduct(id);
  }
}