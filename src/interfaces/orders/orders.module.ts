// src/interfaces/orders/orders.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersController } from './orders.controller';
import { OrderSchema } from '../../domains/orders/schemas/order.schema';

import { CreateOrderUseCase } from '../../application/orders/use-cases/create-order.usecase';
import { UpdateOrderStatusUseCase } from '../../application/orders/use-cases/update-order-status.usecase';
import { EventBus } from '../../common/events/event-bus';
import { OrderRepositoryImpl } from '../../infrastructure/database/mongoose/repositories/order.repository.impl';

import { QueueNumberModule } from '../../domains/orders/services/queue-number.module';

@Module({
  imports: [
    // Register only the schemas strictly managed by this module
    MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
    QueueNumberModule,
  ],
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    { provide: 'OrderRepository', useClass: OrderRepositoryImpl },
    EventBus,
  ],
  // Empty exports unless another module needs to import OrdersModule to use these
  exports: [],
})
export class OrdersModule {}