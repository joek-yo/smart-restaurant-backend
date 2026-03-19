// src/modules/orders/orders.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller'; // <-- add this
import { OrdersGateway } from './orders.gateway';

import { Order, OrderSchema } from './schemas/order.schema';
import { Product, ProductSchema } from '../menu/schemas/product.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [OrdersController], // <-- add the controller here
  providers: [
    OrdersService,
    OrdersGateway,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}