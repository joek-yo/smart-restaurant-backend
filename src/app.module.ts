// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// ✅ CORE EVENT BUS
import { CoreEventModule } from './core/events/core-event.module';

// Infrastructure
import { DatabaseModule } from './database/database.module';
import { MongooseRepositoriesModule } from './infrastructure/database/mongoose/mongoose.repositories.module';

// Feature Modules
import { OrdersModule } from './modules/orders/orders.module';
import { BusinessModule } from './modules/business/business.module';
import { MenuModule } from './domains/menu/menu.module';
import { SessionsModule } from './domains/sessions/sessions.module';
import { CustomersModule } from './domains/customers/customers.module';

// 🔥 NEW: Notifications Module (The Listener Hub)
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // 1. Core Config & Engines
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    CoreEventModule,

    // 2. Infrastructure
    DatabaseModule,
    MongooseRepositoriesModule,

    // 3. Feature Modules (The "Emitters")
    MenuModule,
    OrdersModule,
    BusinessModule,
    SessionsModule,
    CustomersModule,

    // 4. Notification Hub (The "Listeners")
    NotificationsModule, // ✅ Added to the bootstrap process
  ],
})
export class AppModule {}