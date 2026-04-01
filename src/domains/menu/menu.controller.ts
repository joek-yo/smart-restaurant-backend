// src/domains/menu/menu.controller.ts
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
}