// src/domains/customers/events/customer-created.event.ts

/**
 * CustomerCreatedEvent
 * ---------------------
 * Fired when a new global customer is created in the system.
 *
 * IMPORTANT:
 * - No side effects here
 * - Only carries event data
 * - Consumed by event handlers / other domains (notifications, analytics, etc.)
 */

export class CustomerCreatedEvent {
  constructor(
    public readonly payload: {
      id: string;
      phone: string;
      name?: string | null;
      createdAt: Date;
    },
  ) {}
}