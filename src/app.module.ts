// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

// ⛔ still old (fine for now)
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SessionsModule } from './modules/sessions/sessions.module';

// ✅ NEW MENU
import { MenuModule } from './domains/menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    RestaurantsModule,
    MenuModule, // ✅ now using domains/
    OrdersModule,
    SessionsModule,
  ],
})
export class AppModule {}