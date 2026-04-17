// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

// 🔥 ADD THIS
import { MongooseRepositoriesModule } from './infrastructure/database/mongoose/mongoose.repositories.module';

// Modules
import { RestaurantsModule } from './modules/restaurants/restaurants.module';

// Domains
import { SessionsModule } from './domains/sessions/sessions.module';
import { MenuModule } from './domains/menu/menu.module';
import { CustomersModule } from './domains/customers/customers.module';

// Interfaces
import { OrdersModule } from './interfaces/orders/orders.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    // 🔥 THIS CONNECTS DOMAIN → INFRASTRUCTURE
    MongooseRepositoriesModule,

    RestaurantsModule,
    MenuModule,
    OrdersModule,
    SessionsModule,

    CustomersModule,
  ],
})
export class AppModule {}