// FILE: src/core/events/core-event.module.ts
// PURPOSE: Global single-instance event system (NO DUPLICATES ALLOWED)

import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBus } from './event.bus';

@Global()
@Module({
  imports: [
    // SINGLE EventEmitter instance for entire app
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 50,
    }),
  ],

  providers: [
    EventBus,
  ],

  exports: [
    EventBus,
  ],
})
export class CoreEventModule {}