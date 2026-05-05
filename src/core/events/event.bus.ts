// src/core/events/event.bus.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class EventBus {
  constructor(private readonly emitter: EventEmitter2) {}

  emit(event: string, payload: any) {
    this.emitter.emit(event, payload);
  }

  on(event: string, listener: (...args: any[]) => void) {
    this.emitter.on(event, listener);
  }
}
