// FILE: src/modules/payments/application/providers/stripe.provider.ts

/**
 * STRIPE PAYMENT PROVIDER
 * -----------------------
 * 🌍 GLOBAL CARD PAYMENTS IMPLEMENTATION
 *
 * Responsibilities:
 * - Card payments (via Stripe Payment Intents)
 * - Webhook handling (payment_intent.succeeded / failed)
 * - Verification of payment state
 * - Refund handling
 *
 * IMPORTANT:
 * - Must strictly implement PaymentProviderPort
 * - No business logic allowed
 * - Only translate Stripe ↔ internal payment system
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProviderPort,
  InitiatePaymentInput,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookPayload,
  RefundInput,
} from './payment-provider.port';

import { PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';

@Injectable()
export class StripeProvider implements PaymentProviderPort {
  private readonly logger = new Logger(StripeProvider.name);

  // =====================================================
  // 💳 INITIATE PAYMENT (Stripe Payment Intent)
  // =====================================================
  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    this.logger.log(
      `[STRIPE] Creating payment intent | user=${input.userId} order=${input.orderId}`,
    );

    // ⚠️ REAL IMPLEMENTATION WOULD:
    // const stripe = new Stripe(API_KEY)
    // stripe.paymentIntents.create({...})

    const fakeIntentId = `pi_${Date.now()}`;

    return {
      paymentId: `${input.orderId}-payment`,
      providerReference: fakeIntentId,
      status: PaymentStatusVO.INITIATED,
      raw: {
        message: 'Stripe PaymentIntent simulated (replace with real SDK call)',
      },
    };
  }

  // =====================================================
  // 🔍 VERIFY PAYMENT STATUS
  // =====================================================
  async verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
    this.logger.log(`[STRIPE] Verifying payment ${paymentId}`);

    // ⚠️ REAL IMPLEMENTATION:
    // stripe.paymentIntents.retrieve(providerReference)

    return {
      paymentId,
      status: PaymentStatusVO.PENDING_PROVIDER,
      providerReference: `stripe-verify-${paymentId}`,
    };
  }

  // =====================================================
  // 📩 HANDLE STRIPE WEBHOOKS
  // =====================================================
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    this.logger.log(`[STRIPE] Webhook received: ${payload.eventType}`);

    // Typical Stripe events:
    // - payment_intent.succeeded
    // - payment_intent.payment_failed
    // - charge.refunded

    const eventType = payload.eventType;

    if (eventType === 'payment_intent.succeeded') {
      this.logger.log(`[STRIPE] Payment SUCCESS`);
      // Later: emit PaymentConfirmedEvent
    }

    if (eventType === 'payment_intent.payment_failed') {
      this.logger.warn(`[STRIPE] Payment FAILED`);
      // Later: emit PaymentFailedEvent
    }
  }

  // =====================================================
  // 💸 REFUND PAYMENT
  // =====================================================
  async refund(input: RefundInput): Promise<void> {
    this.logger.log(
      `[STRIPE] Refund request for payment=${input.paymentId}`,
    );

    // ⚠️ REAL IMPLEMENTATION:
    // stripe.refunds.create({ payment_intent: providerReference })

    this.logger.log(
      `[STRIPE] Refund simulated (replace with Stripe Refund API)`,
    );
  }
}