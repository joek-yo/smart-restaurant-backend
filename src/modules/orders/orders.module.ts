// src/modules/orders/orders.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// 🔥 CORE EVENT SYSTEM (Crucial for Order Events)
import { CoreEventModule } from '../../core/events/core-event.module';

// Controllers
import { OrdersController } from './presentation/orders.controller';

// Use Cases
import { CreateOrderFromSessionUseCase } from './application/use-cases/create-order-from-session.usecase';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.usecase';

// Repository implementation
import { OrderRepositoryImpl } from './infrastructure/repositories/order.repository.impl';

// ✅ CORRECT TOKEN SOURCE
import { ORDER_REPOSITORY } from './domain/repositories/order.tokens';

// Schema
import { OrderSchema } from './infrastructure/schemas/order.schema';

@Module({
  imports: [
    // ✅ REQUIRED: Explicitly import CoreEventModule for EventBus access
    CoreEventModule,

    MongooseModule.forFeature([
      {
        name: 'Order',
        schema: OrderSchema,
      },
    ]),
  ],

  controllers: [OrdersController],

  providers: [
    CreateOrderFromSessionUseCase,
    UpdateOrderStatusUseCase,

    // ✅ DI BINDING (Interface → Implementation)
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepositoryImpl,
    },
  ],

  // ✅ Export TOKEN so other modules can use the repository
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}