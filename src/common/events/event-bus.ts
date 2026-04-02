// 📁 Path: src/common/events/event-bus.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class EventBus {
  // High-performance EventEmitter2
  private emitter = new EventEmitter2({
    wildcard: true,    // Allows 'order.*' style listeners
    newListener: false,
    maxListeners: 50,  // Support many listeners simultaneously
  });

  /**
   * Publish a domain event.
   * Automatically uses the class name as the event name.
   * Example: OrderCreatedEvent → 'OrderCreatedEvent'
   */
  publish(event: any) {
    const eventName = event.constructor.name;
    this.emit(eventName, event);
  }

  /** Emit with custom event name */
  emit(event: string, payload: any) {
    this.emitter.emit(event, payload);
  }

  /** Listen for string-based events */
  on(event: string, handler: (payload: any) => void) {
    this.emitter.on(event, handler);
  }

  /** Listen once for string-based events */
  once(event: string, handler: (payload: any) => void) {
    this.emitter.once(event, handler);
  }

  /** ⚡ New subscribe method for class-based domain events */
  subscribe<T>(eventClass: new (...args: any) => T, handler: (event: T) => void) {
    const eventName = eventClass.name;
    this.emitter.on(eventName, handler);
  }
}