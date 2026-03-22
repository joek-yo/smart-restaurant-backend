// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';
import { RestaurantsModule } from './modules/restaurants/restaurants.module';
import { MenuModule } from './modules/menu/menu.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SessionsModule } from './modules/sessions/sessions.module'; // ✅ ADD THIS

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RestaurantsModule,
    MenuModule,
    OrdersModule,
    SessionsModule, // ✅ ADD THIS LINE
  ],
})
export class AppModule {}