// FILE: src/core/events/core-event.module.ts
// PURPOSE: Global single-instance event system (NO DUPLICATES ALLOWED)

import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { EventBus } from './event.bus';

@Global()
@Module({
  imports: [
    /**
     * SINGLE GLOBAL EVENT EMITTER
     *
     * IMPORTANT:
// @ts-ignore
     * Never call EventEmitterModule.forRoot()
     * anywhere else in the app.
     */
// @ts-ignore
    EventEmitterModule.forRoot({/* eslint-disable-next-line */// @ts-ignore next-line
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
