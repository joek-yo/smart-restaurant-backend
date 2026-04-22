// src/domains/menu/menu.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// ✅ NEW CORE IMPORT
import { CoreEventModule } from '../../core/events/core-event.module';

import { MenuController } from './menu.controller';
import { ProductController } from './product.controller'; 
import { MenuService } from './menu.service';

import { Category, CategorySchema } from './schemas/category.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import {
  RestaurantSettings,
  RestaurantSettingsSchema,
} from './schemas/restaurant-settings.schema';

@Module({
  imports: [
    // 🔥 CORE EVENT SYSTEM
    CoreEventModule, 

    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: RestaurantSettings.name, schema: RestaurantSettingsSchema },
    ]),
  ],
  controllers: [MenuController, ProductController], 
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}