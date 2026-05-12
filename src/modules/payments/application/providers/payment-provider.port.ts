// FILE: src/modules/payments/application/providers/payment-provider.port.ts

/**
 * PAYMENT PROVIDER PORT (ABSTRACTION LAYER)
 * -----------------------------------------
 * This is the CORE CONTRACT that ALL payment providers must implement.
 *
 * Why this exists:
 * - Decouples business logic from MPESA / Stripe / Aggregators
 * - Enables global expansion without rewriting core domain
 * - Enforces consistent payment lifecycle behavior
 *
 * RULE:
 * 👉 No provider-specific logic should leak outside implementations.
 */

import { MoneyVO } from '../../domain/value-objects/money.vo';
import { PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';
import { ProviderVO } from '../../domain/value-objects/provider.vo';

// =====================================================
// 🔁 CORE INPUT TYPES
// =====================================================

export interface InitiatePaymentInput {
  tenantId: string;
  userId: string;
  orderId: string;

  amount: MoneyVO;
  provider: ProviderVO;

  // MPESA: phone number
  // Stripe: email or token
  customerReference: string;

  metadata?: Record<string, any>;
}

// =====================================================
// 🔁 CORE OUTPUT TYPES
// =====================================================

export interface InitiatePaymentResult {
  paymentId: string;

  providerReference: string; // e.g. MPESA Checkout ID / Stripe Intent ID

  status: PaymentStatusVO;

  // optional provider response metadata
  raw?: any;
}

export interface VerifyPaymentResult {
  paymentId: string;
  status: PaymentStatusVO;
  confirmedAmount?: MoneyVO;
  providerReference?: string;
  raw?: any;
}

export interface WebhookPayload {
  provider: string;
  eventType: string;
  data: any;
  signature?: string;
}

export interface RefundInput {
  paymentId: string;
  amount?: MoneyVO; // partial refund support
  reason?: string;
}

// =====================================================
// 🧠 PAYMENT PROVIDER CONTRACT
// =====================================================

export interface PaymentProviderPort {
  /**
   * INITIATE PAYMENT
   * -----------------
   * Starts payment flow (e.g. MPESA STK Push / Stripe Intent)
   */
  initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult>;

  /**
   * VERIFY PAYMENT
   * --------------
   * Poll or confirm payment status from provider
   */
  verifyPayment(paymentId: string): Promise<VerifyPaymentResult>;

  /**
   * HANDLE WEBHOOK
   * --------------
   * Provider callback entrypoint (MPESA callback / Stripe webhook)
   */
  handleWebhook(payload: WebhookPayload): Promise<void>;

  /**
   * REFUND PAYMENT
   * --------------
   * Full or partial refund support
   */
  refund(input: RefundInput): Promise<void>;
}