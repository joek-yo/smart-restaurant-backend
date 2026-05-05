// 📁 Path: src/common/events/event-bus.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

/**
 * Custom EventBus Wrapper
 * Bridges the gap between Domain Events and the technical EventEmitter implementation.
 */
@Injectable()
export class EventBus {
  // High-performance EventEmitter2 instance
  private emitter = new EventEmitter2({
    wildcard: true,      // Allows 'session.*' or 'order.*' style listeners
    delimiter: '.',      // Standard namespace delimiter
    newListener: false,
    maxListeners: 50,    // Prevents memory leak warnings in complex event chains
  });

  /**
   * Publish a domain event.
   * Uses the class name as the event identifier.
   * Usage: this.eventBus.publish(new SessionStartedEvent(userId));
   */
  publish(event: any) {
    const eventName = event.constructor.name;
    this.emit(eventName, event);
  }

  /** * Emit with a custom string-based event name 
   */
  emit(event: string, payload: any) {
    this.emitter.emit(event, payload);
  }

  /** * Listen for string-based events 
   */
  on(event: string, handler: (payload: any) => void) {
    this.emitter.on(event, handler);
  }

  /** * Listen once for a specific event 
   */
  once(event: string, handler: (payload: any) => void) {
    this.emitter.once(event, handler);
  }

  /** * ⚡ Type-safe subscription for class-based domain events 
   * Usage: this.eventBus.subscribe(SessionStartedEvent, (e) => handle(e));
   */
  subscribe<T>(eventClass: new (...args: any[]) => T, handler: (event: T) => void) {
    const eventName = eventClass.name;
    this.emitter.on(eventName, handler);
  }
}