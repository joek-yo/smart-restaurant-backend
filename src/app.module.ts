// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';

// Infrastructure
import { MongooseRepositoriesModule } from './infrastructure/database/mongoose/mongoose.repositories.module';

// Domains (Older structure - gradually migrating)
import { SessionsModule } from './domains/sessions/sessions.module';
import { MenuModule } from './domains/menu/menu.module';
import { CustomersModule } from './domains/customers/customers.module';

// ✅ MIGRATED MODULES (The New Standard)
import { OrdersModule } from './modules/orders/orders.module';
import { BusinessModule } from './modules/business/business.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,

    // Global Infrastructure binding
    MongooseRepositoriesModule,

    // Feature Modules (Legacy)
    // ❌ REMOVED RestaurantsModule from here
    MenuModule,
    
    // 🔥 MIGRATED: Using the new Clean Architecture modules
    OrdersModule,
    BusinessModule,
    
    SessionsModule,
    CustomersModule,
  ],
})
export class AppModule {}