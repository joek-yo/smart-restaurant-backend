// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CoreEventModule } from '../../core/events/core-event.module';

import { OrdersController } from './presentation/orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderFromSessionUseCase } from './application/use-cases/create-order-from-session.usecase';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.usecase';
import { OrderRepositoryImpl } from './infrastructure/repositories/order.repository.impl';
import { ORDER_REPOSITORY } from './domain/repositories/order.tokens';
import { OrderSchema } from './infrastructure/schemas/order.schema';

@Module({
  imports: [
    CoreEventModule,
    MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    CreateOrderFromSessionUseCase,
    UpdateOrderStatusUseCase,
    { provide: ORDER_REPOSITORY, useClass: OrderRepositoryImpl },
  ],
  exports: [ORDER_REPOSITORY, OrdersService],
})
export class OrdersModule {}
