// FILE: src/core/events/event.bus.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEventType } from './event.constants';

@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);

  constructor(private readonly emitter: EventEmitter2) {}

  // =====================================================
  // 🚀 SAFE EMIT (ONLY VALID EVENTS)
  // =====================================================
  emit(event: AppEventType, payload: Record<string, any>) {
    this.logger.log(
      `[EventBus] emit -> ${event} | payload keys: ${Object.keys(payload || {})}`,
    );

    this.emitter.emit(event, payload);
  }

  // =====================================================
  // 📡 LISTEN (SAFE WRAPPER)
  // =====================================================
  on(event: AppEventType, listener: (...args: any[]) => void) {
    this.logger.log(`[EventBus] listener registered -> ${event}`);

    this.emitter.on(event, listener);
  }
}