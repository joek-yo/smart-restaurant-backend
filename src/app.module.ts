// src/app.module.ts
//
// ✅ FIXED — CheckoutModule added to imports (was missing — caused silent failure).

import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core
import { CoreEventModule } from './core/events/core-event.module';
import { TenantMiddleware } from './core/tenant/tenant.middleware';
import { TenantModule } from './core/tenant/tenant.module';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';

// Modules
import { BusinessModule } from './modules/business/business.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { OrdersModule } from './modules/orders/orders.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { CheckoutModule } from './modules/checkout/checkout.module'; // ✅ ADDED
import { CustomersModule } from './modules/customers/customers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { WhatsAppModule } from './modules/channels/whatsapp.module';
import { ConversationModule } from './modules/conversation/conversation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    CoreEventModule,
    TenantModule,
    DatabaseModule,
    BusinessModule,
    CatalogModule,
    OrdersModule,
    SessionsModule,
    CheckoutModule,       // ✅ Engine is now live
    CustomersModule,
    NotificationsModule,
    AuthModule,
    WhatsAppModule,
    ConversationModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*');
  }
}