// FILE: src/modules/payments/domain/events/payment-failed.event.ts

import { PaymentProvider } from '../value-objects/provider.vo';

/**
 * PaymentFailedEvent
 * -------------------
 * Fired when a payment attempt fails at provider level
 * (Mpesa reject, Stripe decline, timeout, network error, etc.)
 *
 * PURPOSE:
 * - Trigger retry strategy
 * - Enable fallback provider routing
 * - Notify user via WhatsApp / SMS / email
 * - Feed analytics + failure tracking
 *
 * IMPORTANT:
 * - NOT final state unless all retries exhausted
 * - Failure is a SIGNAL, not a termination
 */

export interface PaymentFailedEventPayload {
  paymentId: string;

  // 🔐 TENANT CONTEXT
  tenantId: string;

  // 👤 CUSTOMER CONTEXT
  customerId: string;
  orderId?: string;

  // 💰 PAYMENT CONTEXT
  amount: number;
  currency: string;

  // 🏦 PROVIDER THAT FAILED
  provider: PaymentProvider;

  // 🔁 ATTEMPT INFO
  attemptId?: string;
  attemptNumber: number;

  // ❌ FAILURE DETAILS
  failureReason: string;
  failureCode?: string;

  // 🌐 PROVIDER RESPONSE (raw unsafe data)
  providerReference?: string;
  providerPayload?: Record<string, any>;

  // 📅 TIMESTAMP
  failedAt: Date;

  // 🧠 RECOVERY CONTEXT
  isRetryable: boolean;
  suggestedNextAction?: 'RETRY' | 'FALLBACK_PROVIDER' | 'CANCEL';
}

/**
 * DOMAIN EVENT WRAPPER
 */
export class PaymentFailedEvent {
  constructor(public readonly payload: PaymentFailedEventPayload) {}
}