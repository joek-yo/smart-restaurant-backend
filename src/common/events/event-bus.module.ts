// src/common/events/event-bus.module.ts
import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus';

@Global() // Makes EventBus available globally
@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class EventBusModule {}