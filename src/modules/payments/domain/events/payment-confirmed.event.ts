// FILE: src/modules/payments/domain/events/payment-confirmed.event.ts

import { PaymentProvider } from '../value-objects/provider.vo';

/**
 * PaymentConfirmedEvent
 * ----------------------
 * Fired when a payment is successfully confirmed by provider.
 *
 * PURPOSE:
 * - Unlock order fulfillment
 * - Trigger WhatsApp/customer notifications
 * - Drive analytics + revenue tracking
 *
 * IMPORTANT:
 * - This is the ONLY trusted signal of payment success
 * - Must originate from verified provider callback OR reconciliation engine
 */

export interface PaymentConfirmedEventPayload {
  paymentId: string;

  // 🔐 TENANT CONTEXT
  tenantId: string;

  // 👤 CUSTOMER CONTEXT
  customerId: string;
  orderId?: string;

  // 💰 CONFIRMED AMOUNT
  amount: number;
  currency: string;

  // 🏦 PROVIDER WHO CONFIRMED
  provider: PaymentProvider;

  // 🔗 PROVIDER REFERENCE (Mpesa code / Stripe intent id)
  providerReference: string;

  // 📅 TIMESTAMP OF CONFIRMATION
  confirmedAt: Date;

  // 📊 OPTIONAL CONTEXT
  metadata?: {
    phoneNumber?: string;
    receiptNumber?: string;
    transactionCode?: string;
  };
}

/**
 * DOMAIN EVENT WRAPPER
 */
export class PaymentConfirmedEvent {
  constructor(public readonly payload: PaymentConfirmedEventPayload) {}
}