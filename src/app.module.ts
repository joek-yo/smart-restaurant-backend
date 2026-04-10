// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

// Modules
import { RestaurantsModule } from './modules/restaurants/restaurants.module';

// ✅ POINT TO DOMAINS, NOT MODULES
import { SessionsModule } from './domains/sessions/sessions.module'; 

// ✅ High-end domain modules
import { MenuModule } from './domains/menu/menu.module';
import { OrdersModule } from './interfaces/orders/orders.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    RestaurantsModule,
    MenuModule,
    OrdersModule,
    SessionsModule, // This now points to the new domain!
  ],
})
export class AppModule {}