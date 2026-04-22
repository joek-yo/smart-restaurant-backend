// src/core/events/event.module.ts

import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBus } from './event.bus';

@Global() // Makes EventBus available everywhere without re-importing
@Module({
  imports: [
    // Initialize the NestJS emitter engine here
    EventEmitterModule.forRoot() 
  ],
  providers: [EventBus],
  exports: [EventBus],
})
export class CoreEventModule {}