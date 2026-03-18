// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from '../database/database.module';
import { RestaurantsModule } from '../modules/restaurants/restaurants.module';
import { MenuModule } from '../modules/menu/menu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    DatabaseModule,

    RestaurantsModule,

    MenuModule,   // ← our new Menu Engine
  ],
})
export class AppModule {}