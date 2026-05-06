// src/modules/catalog/presentation/catalog.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { CatalogService } from '../application/catalog.service';
import { CreateCategoryDto } from '../application/dto/create-category.dto';
import { UpdateCategoryDto } from '../application/dto/update-category.dto';
import { CatalogSettings } from '../infrastructure/schemas/catalog-settings.schema';
import { TenantGuard } from '../../../core/tenant/tenant.guard';

@Controller('catalog')
@UseGuards(TenantGuard)
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  // ── Categories ─────────────────────────────────────────────────────────────

  @Post('categories')
  async createCategory(@Req() req: Request, @Body() dto: CreateCategoryDto) {
    const category = await this.catalogService.createCategory(req.tenantId!, dto);
    return { success: true, category };
  }

  @Get('categories')
  async findCategories(@Req() req: Request) {
    const categories = await this.catalogService.findCategories(req.tenantId!);
    return { success: true, categories };
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const updated = await this.catalogService.updateCategory(id, dto);
    return { success: !!updated, updated };
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    const deleted = await this.catalogService.deleteCategory(id);
    return { success: !!deleted };
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  @Get('settings')
  async getSettings(@Req() req: Request) {
    const settings = await this.catalogService.getCatalogSettings(req.tenantId!);
    return { success: true, settings };
  }

  @Patch('settings')
  async upsertSettings(@Req() req: Request, @Body() data: Partial<CatalogSettings>) {
    const settings = await this.catalogService.upsertCatalogSettings(req.tenantId!, data);
    return { success: true, settings };
  }

  // ── Products ───────────────────────────────────────────────────────────────

  @Get('products')
  async listProducts(@Req() req: Request) {
    const products = await this.catalogService.getProducts(req.tenantId!);
    return Array.isArray(products) ? products : [];
  }
}
