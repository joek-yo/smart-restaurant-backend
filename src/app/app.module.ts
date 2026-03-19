// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '../database/database.module';
import { RestaurantsModule } from '../modules/restaurants/restaurants.module';
import { MenuModule } from '../modules/menu/menu.module';
import { OrdersModule } from '../modules/orders/orders.module'; // ✅ Orders Engine

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database connection
    DatabaseModule,

    // Feature modules
    RestaurantsModule, // Restaurant CRUD
    MenuModule,        // Categories & Products
    OrdersModule,      // Orders engine (create, update status, realtime)
  ],
})
export class AppModule {}