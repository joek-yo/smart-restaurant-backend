// src/core/events/core-event.module.ts

import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventBus } from './event.bus';

// Listeners
import { BusinessCreatedListener } from './listeners/business-created.listener';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
  ],

  providers: [
    EventBus, // ✅ THIS WAS MISSING
    BusinessCreatedListener,
  ],

  exports: [
    EventBus, // ✅ REQUIRED so other modules can inject it
  ],
})
export class CoreEventModule {}