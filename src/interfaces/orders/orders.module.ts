// src/interfaces/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersController } from './orders.controller';
import { OrderSchema } from '../../domains/orders/schemas/order.schema';
import { CounterSchema } from '../../domains/counters/schemas/counter.schema'; // ✅ import counter schema

import { CreateOrderUseCase } from '../../application/orders/use-cases/create-order.usecase';
import { UpdateOrderStatusUseCase } from '../../application/orders/use-cases/update-order-status.usecase';

import { QueueNumberService } from '../../domains/orders/services/queue-number.service'; // ✅ exported now
import { EventBus } from '../../common/events/event-bus';
import { OrderRepositoryImpl } from '../../infrastructure/database/mongoose/repositories/order.repository.impl';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Order', schema: OrderSchema },
      { name: 'Counter', schema: CounterSchema }, // ✅ add Counter here
    ]),
  ],
  controllers: [OrdersController],
  providers: [
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    QueueNumberService,
    { provide: 'OrderRepository', useClass: OrderRepositoryImpl },
    EventBus,
  ],
})
export class OrdersModule {}