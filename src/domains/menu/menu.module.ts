// src/domains/menu/menu.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { MenuController } from './menu.controller';
import { ProductController } from './product.controller'; // ✅ NEW
import { MenuService } from './menu.service';

import { Category, CategorySchema } from './schemas/category.schema';
import { Product, ProductSchema } from './schemas/product.schema';
import {
  RestaurantSettings,
  RestaurantSettingsSchema,
} from './schemas/restaurant-settings.schema';

import { EventBusModule } from '../../common/events/event-bus.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: RestaurantSettings.name, schema: RestaurantSettingsSchema },
    ]),
    EventBusModule,
  ],
  controllers: [MenuController, ProductController], // ✅ UPDATED
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}