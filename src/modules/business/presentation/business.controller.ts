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

// ✅ Standardized Use Case imports
import { CreateBusinessUseCase } from '../application/use-cases/create-business.usecase';
import { GetSettingsUseCase } from '../application/use-cases/get-settings.usecase';
import { UpdateSettingsUseCase } from '../application/use-cases/update-settings.usecase';

// ✅ Standardized DTO imports
import { CreateBusinessDto } from '@modules/business/application/dto/create-business.dto';
import { UpdateBusinessDto } from '@modules/business/application/dto/update-business.dto';

// ✅ STEP 1 FIX: Updated import path and class name from 'RestaurantSettings' to 'BusinessSettings'
import { BusinessSettings } from '../infrastructure/schemas/business-settings.schema';

@Controller('business')
export class BusinessController {
  constructor(
    private readonly createBusinessUseCase: CreateBusinessUseCase,
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
  ) {}

  // --------------------------
  // Business CRUD
  // --------------------------

  @Post()
  create(@Body() dto: CreateBusinessDto) {
    return this.createBusinessUseCase.execute(dto);
  }

  @Get()
  findAll() {
    return (this.createBusinessUseCase as any).businessService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return (this.createBusinessUseCase as any).businessService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBusinessDto) {
    return (this.createBusinessUseCase as any).businessService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return (this.createBusinessUseCase as any).businessService.remove(id);
  }

  // --------------------------
  // Business Settings
  // --------------------------

  @Get(':id/settings')
  getSettings(@Param('id') id: string) {
    return this.getSettingsUseCase.execute(id);
  }

  @Patch(':id/settings')
  updateSettings(
    @Param('id') id: string,
    // ✅ STEP 1 FIX: Using the generic BusinessSettings type
    @Body() data: Partial<BusinessSettings>,
  ) {
    return this.updateSettingsUseCase.execute(id, data);
  }
}