// src/modules/orders/orders.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CoreEventModule } from '../../core/events/core-event.module';

import { OrdersController } from './presentation/orders.controller';
import { OrdersService } from './orders.service';

import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.usecase';

import { OrderRepositoryImpl } from './infrastructure/repositories/order.repository.impl';
import { ORDER_REPOSITORY } from './domain/repositories/order.tokens';
import { OrderSchema } from './infrastructure/schemas/order.schema';

/**
 * OrdersModule
 * ------------
 * Responsibility:
 * - Owns ORDER lifecycle AFTER checkout completion
 * - Exposes ORDER_REPOSITORY for use by checkout module
 * - Handles status transitions and order queries
 *
 * IMPORTANT:
 * - Order creation from sessions is handled exclusively by:
 *   CheckoutModule → CreateOrderFromCheckoutUseCase
 * - This module does NOT create orders from sessions
 */
@Module({
  imports: [
    CoreEventModule,
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
    ]),
  ],

  controllers: [
    OrdersController,
  ],

  providers: [
    OrdersService,

    // ─────────────────────────────────────────────
    // USE CASES
    // ─────────────────────────────────────────────
    UpdateOrderStatusUseCase,

    // ─────────────────────────────────────────────
    // REPOSITORY BINDING
    // ─────────────────────────────────────────────
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepositoryImpl,
    },
  ],

  exports: [
    // repository for checkout module
    ORDER_REPOSITORY,

    // service for internal orchestration
    OrdersService,
  ],
})
export class OrdersModule {}