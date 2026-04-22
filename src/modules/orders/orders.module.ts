import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Controllers
import { OrdersController } from './presentation/orders.controller';

// Use Cases
import { CreateOrderFromSessionUseCase } from './application/use-cases/create-order-from-session.usecase';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.usecase';

// Repository implementation
import { OrderRepositoryImpl } from './infrastructure/repositories/order.repository.impl';

// ✅ CORRECT TOKEN SOURCE (FIXED)
import { ORDER_REPOSITORY } from './domain/repositories/order.tokens';

// Schema
import { OrderSchema } from './infrastructure/schemas/order.schema';

@Module({
  imports: [
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

  // ✅ Export TOKEN (not interface)
  exports: [ORDER_REPOSITORY],
})
export class OrdersModule {}