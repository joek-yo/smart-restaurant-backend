// src/domains/counters/counters.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CounterSchema } from './schemas/counter.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Counter', schema: CounterSchema }]),
  ],
  exports: [
    MongooseModule, // export so QueueNumberService can inject Counter model
  ],
})
export class CountersModule {}