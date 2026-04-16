// src/domains/menu/product.controller.ts

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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('menu/products')
export class ProductController {
  constructor(private readonly menuService: MenuService) {}

  /* =====================================================
     CREATE PRODUCT
  ===================================================== */
  @Post(':businessId')
  createProduct(
    @Param('businessId') businessId: string,
    @Body() dto: CreateProductDto,
  ) {
    return this.menuService.createProduct(businessId, dto);
  }

  /* =====================================================
     GET PRODUCTS BY BUSINESS
  ===================================================== */
  @Get(':businessId')
  getProducts(@Param('businessId') businessId: string) {
    return this.menuService.getProducts(businessId);
  }

  /* =====================================================
     GET PRODUCTS BY CATEGORY
  ===================================================== */
  @Get('category/:categoryId')
  getProductsByCategory(@Param('categoryId') categoryId: string) {
    return this.menuService.getProductsByCategory(categoryId);
  }

  /* =====================================================
     UPDATE PRODUCT
  ===================================================== */
  @Patch(':id')
  updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.menuService.updateProduct(id, dto);
  }

  /* =====================================================
     DELETE PRODUCT
  ===================================================== */
  @Delete(':id')
  deleteProduct(@Param('id') id: string) {
    return this.menuService.deleteProduct(id);
  }
}