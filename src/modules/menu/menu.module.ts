// src/modules/menu/menu.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CoreEventModule } from '@core/events/core-event.module';

import { MenuController } from './presentation/menu.controller';
import { ProductController } from './presentation/product.controller';
import { MenuService } from './application/menu.service';

import { Category, CategorySchema } from './infrastructure/schemas/category.schema';
import { Product, ProductSchema } from './infrastructure/schemas/product.schema';
import { RestaurantSettings, RestaurantSettingsSchema } from './infrastructure/schemas/restaurant-settings.schema';

@Module({
  imports: [
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
