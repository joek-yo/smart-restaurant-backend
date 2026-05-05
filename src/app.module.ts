// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core
import { CoreEventModule } from './core/events/core-event.module';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';

// ✅ ONLY BusinessModule active — others commented out until backend refactor is complete
import { BusinessModule } from './modules/business/business.module';

// 🔴 Commented out — broken mid-refactor, fix later as separate branch
// import { MongooseRepositoriesModule } from './infrastructure/database/mongoose/mongoose.repositories.module';
// import { OrdersModule } from './modules/orders/orders.module';
// import { MenuModule } from './modules/menu/menu.module';
// import { SessionsModule } from './modules/sessions/sessions.module';
// import { CustomersModule } from './modules/customers/customers.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    CoreEventModule,

    DatabaseModule,
    // MongooseRepositoriesModule,

    BusinessModule,
    // MenuModule,
    // OrdersModule,
    // SessionsModule,
    // CustomersModule,
    // NotificationsModule,
  ],
})
export class AppModule {}