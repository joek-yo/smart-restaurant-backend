// src/modules/restaurants/restaurants.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RestaurantsService } from './restaurants.service';
import { RestaurantsController } from './restaurants.controller';
import { Restaurant, RestaurantSchema } from './schemas/restaurant.schema';
import { RestaurantSettings, RestaurantSettingsSchema } from './schemas/restaurant-settings.schema';

import { CreateRestaurantUseCase } from './use-cases/create-restaurant';
import { UpdateRestaurantUseCase } from './use-cases/update-restaurant';
import { GetSettingsUseCase } from './use-cases/get-settings';
import { UpdateSettingsUseCase } from './use-cases/update-settings';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
      { name: RestaurantSettings.name, schema: RestaurantSettingsSchema }, // ✅ register model
    ]),
  ],
  controllers: [RestaurantsController],
  providers: [
    RestaurantsService,
    CreateRestaurantUseCase,
    UpdateRestaurantUseCase,
    GetSettingsUseCase,
    UpdateSettingsUseCase,
  ],
  exports: [
    RestaurantsService,
    CreateRestaurantUseCase,
    UpdateRestaurantUseCase,
    GetSettingsUseCase,
    UpdateSettingsUseCase,
  ],
})
export class RestaurantsModule {}