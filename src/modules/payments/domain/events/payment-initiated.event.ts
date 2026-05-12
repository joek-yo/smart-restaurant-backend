// FILE: src/modules/payments/domain/events/payment-initiated.event.ts

import { PaymentProvider } from '../value-objects/provider.vo';

/**
 * PaymentInitiatedEvent
 * ----------------------
 * Fired when a payment enters INITIATED state.
 *
 * PURPOSE:
 * - Triggers provider execution (Mpesa STK Push / Stripe Intent / etc.)
 * - Decouples payment creation from provider logic
 * - Enables async processing + retries
 *
 * IMPORTANT:
 * - This is NOT confirmation of payment
 * - This ONLY means "send request to provider"
 */

export interface PaymentInitiatedEventPayload {
  paymentId: string;

  // 🔐 TENANT ISOLATION
  tenantId: string;

  // 👤 CUSTOMER CONTEXT
  customerId: string;
  orderId?: string;

  // 💰 FINANCIAL DATA
  amount: number;
  currency: string;

  // 🏦 PROVIDER TARGET
  provider: PaymentProvider;

  // 📞 PROVIDER INPUT CONTEXT
  phoneNumber?: string; // critical for Mpesa STK push
  email?: string;       // useful for Stripe

  // 🔁 SAFETY
  attemptNumber: number;

  // 📅 EVENT TIME
  initiatedAt: Date;
}

/**
 * DOMAIN EVENT CLASS
 */
export class PaymentInitiatedEvent {
  constructor(public readonly payload: PaymentInitiatedEventPayload) {}
}