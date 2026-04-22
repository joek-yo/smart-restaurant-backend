// src/core/events/event.module.ts

import { DebugEventListener } from './listeners/debug.listener';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    EventBus,
    DebugEventListener, // ✅ ADD THIS
  ],
  exports: [EventBus],
})
export class CoreEventModule {}