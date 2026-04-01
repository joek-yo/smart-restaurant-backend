// src/modules/restaurants/restaurants.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { CreateRestaurantUseCase } from './use-cases/create-restaurant';
import { UpdateRestaurantUseCase } from './use-cases/update-restaurant';
import { GetSettingsUseCase } from './use-cases/get-settings';
import { UpdateSettingsUseCase } from './use-cases/update-settings';

import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantSettings } from './schemas/restaurant-settings.schema';

@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly createRestaurantUseCase: CreateRestaurantUseCase,
    private readonly updateRestaurantUseCase: UpdateRestaurantUseCase,
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
  ) {}

  // --------------------------
  // Restaurant CRUD
  // --------------------------

  @Post()
  create(@Body() dto: CreateRestaurantDto) {
    return this.createRestaurantUseCase.execute(dto);
  }

  @Get()
  findAll() {
    // You can wrap a new GetAllUseCase later if needed
    return this.createRestaurantUseCase['restaurantsService'].findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.createRestaurantUseCase['restaurantsService'].findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    return this.updateRestaurantUseCase.execute(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.createRestaurantUseCase['restaurantsService'].remove(id);
  }

  // --------------------------
  // Restaurant Settings
  // --------------------------

  @Get(':id/settings')
  getSettings(@Param('id') id: string) {
    return this.getSettingsUseCase.execute(id);
  }

  @Patch(':id/settings')
  updateSettings(
    @Param('id') id: string,
    @Body() data: Partial<RestaurantSettings>,
  ) {
    return this.updateSettingsUseCase.execute(id, data);
  }
}