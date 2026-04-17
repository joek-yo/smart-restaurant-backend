// src/domains/customers/events/business-customer-created.event.ts

/**
 * BusinessCustomerCreatedEvent
 * ----------------------------
 * Fired when a customer is linked to a specific business (tenant context).
 *
 * IMPORTANT:
 * - Represents tenant-level relationship creation
 * - Enables segmentation, onboarding flows, WhatsApp triggers later
 * - No business logic inside event
 */

export class BusinessCustomerCreatedEvent {
  constructor(
    public readonly payload: {
      id: string;
      businessId: string;
      customerId: string;
      createdAt: Date;
    },
  ) {}
}