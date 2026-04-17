// src/domains/customers/handlers/customer-created.handler.ts

import { CustomerCreatedEvent } from '../events/customer-created.event';

/**
 * CustomerCreatedHandler
 * -----------------------
 * Handles side effects when a Customer is created.
 *
 * IMPORTANT:
 * - This is an EVENT HANDLER (not business logic)
 * - Should NOT modify core domain state
 * - Used for logging, analytics, future integrations (WhatsApp, campaigns, etc.)
 */

export class CustomerCreatedHandler {
  /**
   * Handle the event
   */
  async handle(event: CustomerCreatedEvent): Promise<void> {
    const { id, phone, createdAt } = event.payload;

    // -----------------------------
    // SIDE EFFECTS ONLY (SAFE ZONE)
    // -----------------------------

    console.log('[CustomerCreatedEvent]', {
      customerId: id,
      phone,
      createdAt,
    });

    // Future integrations (DO NOT ENABLE YET IN MVP CORE):
    // - analytics tracking
    // - WhatsApp welcome trigger
    // - segmentation engine tagging
    // - CRM sync
  }
}