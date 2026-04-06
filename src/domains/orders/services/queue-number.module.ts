// src/domains/orders/services/queue-number.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CounterSchema } from '../../counters/schemas/counter.schema';
import { QueueNumberService } from './queue-number.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Counter', schema: CounterSchema }]),
  ],
  providers: [QueueNumberService],
  exports: [QueueNumberService], // ✅ export to make it available to OrdersModule
})
export class QueueNumberModule {}