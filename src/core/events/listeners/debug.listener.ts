// 📁 src/core/events/listeners/debug.listener.ts

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class DebugEventListener {
  @OnEvent('**') // Listens to all events for debugging
  handleAllEvents(payload: any, event: string) {
    console.log(`[DEBUG EVENT] [${event}]:`, JSON.stringify(payload, null, 2));
  }
}