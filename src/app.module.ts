// src/app.module.ts

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
import { CustomersModule } from './modules/customers/customers.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuthModule } from './modules/auth/auth.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
// --- Add these two lines ---
import { AboutModule } from './modules/about/about.module';
import { BlogModule } from './modules/blog/blog.module';

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
    CustomersModule,
    NotificationsModule,
    AuthModule,
    WhatsAppModule,
    // --- Add these two lines ---
    AboutModule,
    BlogModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('*'); // Apply to ALL routes
  }
}