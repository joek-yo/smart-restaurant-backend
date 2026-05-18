// src/modules/orders/orders.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoreEventModule } from '@core/events/core-event.module';
import { CountersModule } from '@modules/counters/counters.module';

import { OrdersController } from './presentation/orders.controller';
import { OrdersService } from './orders.service';

import { CreateOrderUseCase } from './application/use-cases/create-order.use-case';
import { UpdateOrderStatusUseCase } from './application/use-cases/update-order-status.usecase';

import { ORDER_REPOSITORY } from './domain/repositories/order.tokens';
import { OrderRepositoryImpl } from './infrastructure/repositories/order.repository.impl';

import { OrderTypeormEntity } from './infrastructure/persistence/postgres/entities/order.typeorm-entity';
import { OrderItemTypeormEntity } from './infrastructure/persistence/postgres/entities/order-item.typeorm-entity';
import { OrderTypeormRepository } from './infrastructure/persistence/postgres/order.typeorm.repository';

import { OrderCreatedHandler } from './application/handlers/order-created.handler';
import { OrderStatusUpdatedHandler } from './application/handlers/order-status-updated.handler';

@Module({
  imports: [
    CoreEventModule,
    CountersModule,
    TypeOrmModule.forFeature([
      OrderTypeormEntity,
      OrderItemTypeormEntity,
    ]),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    CreateOrderUseCase,
    UpdateOrderStatusUseCase,
    OrderTypeormRepository,
    {
      provide: ORDER_REPOSITORY,
      useClass: OrderRepositoryImpl,
    },
    OrderCreatedHandler,
    OrderStatusUpdatedHandler,
  ],
  exports: [ORDER_REPOSITORY, OrdersService],
})
export class OrdersModule {}
