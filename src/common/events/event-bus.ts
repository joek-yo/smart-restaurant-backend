// src/common/events/event-bus.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';

@Injectable()
export class EventBus {
  // Keeping your custom configuration for high-performance event handling
  private emitter = new EventEmitter2({
    wildcard: true,          // Allows for 'order.*' style listeners
    newListener: false,
    maxListeners: 50,        // High limit for many simultaneous kitchen/whatsapp listeners
  });

  /** * The "Publish" method used by our Use Cases.
   * It automatically names the event based on the Class Name 
   * (e.g., OrderCreatedEvent) so you don't have to type strings.
   */
  publish(event: any) {
    const eventName = event.constructor.name;
    this.emit(eventName, event);
  }

  /** Standard Emit for manual string events */
  emit(event: string, payload: any) {
    this.emitter.emit(event, payload);
  }

  /** Listener for standard events */
  on(event: string, handler: (payload: any) => void) {
    this.emitter.on(event, handler);
  }

  /** Single-use listener */
  once(event: string, handler: (payload: any) => void) {
    this.emitter.once(event, handler);
  }
}