// src/modules/catalog/presentation/product.controller.ts
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
import { CreateProductDto } from '../application/dto/create-product.dto';
import { UpdateProductDto } from '../application/dto/update-product.dto';
import { TenantGuard } from '../../../core/tenant/tenant.guard';

@Controller('catalog/products')
@UseGuards(TenantGuard)
export class ProductController {
  constructor(private readonly catalogService: CatalogService) {}

  @Post()
  createProduct(@Req() req: Request, @Body() dto: CreateProductDto) {
    return this.catalogService.createProduct(req.tenantId!, dto);
  }

  @Get()
  getProducts(@Req() req: Request) {
    return this.catalogService.getProducts(req.tenantId!);
  }

  @Get('category/:categoryId')
  getProductsByCategory(@Param('categoryId') categoryId: string) {
    return this.catalogService.getProductsByCategory(categoryId);
  }

  @Patch(':id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Delete(':id')
  deleteProduct(@Param('id') id: string) {
    return this.catalogService.deleteProduct(id);
  }
}
