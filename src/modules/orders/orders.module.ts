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

// ─────────────────────────────────────────────
// EVENT HANDLERS (MISSING FIX)
// ─────────────────────────────────────────────
import { OrderCreatedHandler } from './application/handlers/order-created.handler';
import { OrderStatusUpdatedHandler } from './application/handlers/order-status-updated.handler';

/**
 * OrdersModule
 * ------------
 * PURE BUSINESS OWNERSHIP LAYER
 *
 * RULES:
 * ❌ Does NOT initiate checkout
 * ❌ Does NOT read conversation state
 * ❌ Does NOT manage sessions
 *
 * ✅ ONLY:
 * - order lifecycle
 * - order status transitions
 * - order persistence
 * - reacting to checkout completion events
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
    // ─────────────────────────────────────────────
    // CORE SERVICE
    // ─────────────────────────────────────────────
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

    // ─────────────────────────────────────────────
    // EVENT HANDLERS (CRITICAL FIX)
    // ─────────────────────────────────────────────
    OrderCreatedHandler,
    OrderStatusUpdatedHandler,
  ],

  exports: [
    ORDER_REPOSITORY,
    OrdersService,
  ],
})
export class OrdersModule {}