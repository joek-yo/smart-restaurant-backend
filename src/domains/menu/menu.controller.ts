// 📁 src/domains/menu/menu.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { RestaurantSettings } from './schemas/restaurant-settings.schema';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /* =====================================================
     CATEGORY ROUTES
  ===================================================== */

  @Post('categories/:businessId')
  async createCategory(
    @Param('businessId') businessId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    const category = await this.menuService.createCategory(businessId, dto);
    return { success: true, category };
  }

  @Get('categories/:businessId')
  async findCategories(@Param('businessId') businessId: string) {
    const categories = await this.menuService.findCategories(businessId);
    return { success: true, categories };
  }

  @Patch('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const updated = await this.menuService.updateCategory(id, dto);
    return { success: !!updated, updated };
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    const deleted = await this.menuService.deleteCategory(id);
    return { success: !!deleted };
  }

  /* =====================================================
     RESTAURANT SETTINGS ROUTES
  ===================================================== */

  @Get('settings/:businessId')
  async getSettings(@Param('businessId') businessId: string) {
    const settings = await this.menuService.getRestaurantSettings(businessId);
    return { success: true, settings };
  }

  @Patch('settings/:businessId')
  async upsertSettings(
    @Param('businessId') businessId: string,
    @Body() data: Partial<RestaurantSettings>,
  ) {
    const settings = await this.menuService.upsertRestaurantSettings(
      businessId,
      data,
    );
    return { success: true, settings };
  }

  /* =====================================================
     PRODUCTS ROUTE (FIXED)
  ===================================================== */

  @Get('products/:businessId')
  async listProducts(@Param('businessId') businessId: string) {
    try {
      const products = await this.menuService.getProducts(businessId);

      // Ensure Postman gets an array
      return Array.isArray(products) ? products : [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new HttpException(
        { statusCode: 500, message: 'Internal server error' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}