// src/modules/restaurants/use-cases/update-restaurant.ts
import { Injectable } from '@nestjs/common';
import { RestaurantsService } from '../restaurants.service';
import { UpdateRestaurantDto } from '../dto/update-restaurant.dto';

@Injectable()
export class UpdateRestaurantUseCase {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  execute(id: string, dto: UpdateRestaurantDto) {
    return this.restaurantsService.update(id, dto);
  }
}

// ✅ Ensure this file is a module by exporting the class
export {}; // This ensures TypeScript treats this as a module