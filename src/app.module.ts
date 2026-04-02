// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

// Modules
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { SessionsModule } from './modules/sessions/sessions.module';

// ✅ High-end domain modules
import { MenuModule } from './domains/menu/menu.module';
import { OrdersModule } from './interfaces/orders/orders.module'; // updated path

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    RestaurantsModule,
    MenuModule,
    OrdersModule,  // ✅ clean, modern Orders module
    SessionsModule,
  ],
})
export class AppModule {}