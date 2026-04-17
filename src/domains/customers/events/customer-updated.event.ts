// src/domains/customers/events/customer-updated.event.ts

/**
 * CustomerUpdatedEvent
 * --------------------
 * Fired whenever a global customer record is modified.
 *
 * IMPORTANT:
 * - Carries only change metadata
 * - No logic or side effects here
 * - Consumed by analytics, notifications, and sync systems
 */

export class CustomerUpdatedEvent {
  constructor(
    public readonly payload: {
      id: string;
      changes: Record<string, any>;
      updatedAt: Date;
    },
  ) {}
}