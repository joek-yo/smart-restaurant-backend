// src/common/events/event-bus.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class EventBus {
  private emitter = new EventEmitter2({
    wildcard: true,
    newListener: false,
    maxListeners: 50,
  });

  emit(event: string, payload: any) {
    this.emitter.emit(event, payload);
  }

  on(event: string, handler: (payload: any) => void) {
    this.emitter.on(event, handler);
  }

  once(event: string, handler: (payload: any) => void) {
    this.emitter.once(event, handler);
  }
}