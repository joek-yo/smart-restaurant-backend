// src/modules/restaurants/use-cases/create-restaurant.ts

import { Injectable } from '@nestjs/common';
import { RestaurantsService } from '../restaurants.service';
import { CreateRestaurantDto } from '../dto/create-restaurant.dto';

@Injectable()
export class CreateRestaurantUseCase {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  execute(dto: CreateRestaurantDto) {
    return this.restaurantsService.create(dto);
  }
}