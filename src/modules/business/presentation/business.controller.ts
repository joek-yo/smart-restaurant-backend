// src/modules/business/presentation/business.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { BusinessService } from '@modules/business/application/business.service';
import { CreateBusinessDto } from '@modules/business/application/dto/create-business.dto';
import { UpdateBusinessDto } from '@modules/business/application/dto/update-business.dto';
import { StorefrontConfig } from '@modules/business/infrastructure/schemas/business.schema';

@Controller('businesses')
export class BusinessController {
  // Inject BusinessService directly — no use-case indirection needed for
  // simple CRUD. Use cases are for operations with business rules / side effects.
  constructor(private readonly businessService: BusinessService) {}

  // ── CRUD ───────────────────────────────────────────────────────────────────

  @Post()
  create(@Body() dto: CreateBusinessDto) {
    return this.businessService.create(dto);
  }

  @Get()
  findAll() {
    return this.businessService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return this.businessService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessService.remove(id);
  }

  // ── Tenant resolution endpoints (used by Next.js middleware) ───────────────
  // These are PUBLIC — no auth guard. They return only what the storefront needs.

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.businessService.findBySlug(slug);
  }

  @Get('domain/:domain')
  findByDomain(@Param('domain') domain: string) {
    return this.businessService.findByDomain(domain);
  }

  // ── Storefront config ──────────────────────────────────────────────────────

  @Get(':id/storefront')
  getStorefront(@Param('id') id: string) {
    return this.businessService.getStorefront(id);
  }

  @Patch(':id/storefront')
  updateStorefront(
    @Param('id') id: string,
    @Body() config: Partial<StorefrontConfig>,
  ) {
    return this.businessService.updateStorefront(id, config);
  }
}