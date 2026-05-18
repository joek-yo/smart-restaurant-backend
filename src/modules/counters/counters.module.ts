// src/modules/counters/counters.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CounterSchema } from './infrastructure/schemas/counter.schema';
import { QueueNumberService } from './application/services/queue-number.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Counter', schema: CounterSchema },
    ]),
  ],
  providers: [QueueNumberService],
  exports: [QueueNumberService],
})
export class CountersModule {}
