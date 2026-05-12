// FILE: src/modules/payments/application/providers/aggregator.provider.ts

/**
 * AGGREGATOR PAYMENT PROVIDER
 * ----------------------------
 * 🌍 MULTI-PSP ROUTING LAYER (FUTURE-READY)
 *
 * Purpose:
 * This provider does NOT process payments directly.
 * Instead, it ROUTES requests to the best underlying PSP:
 * - MPESA (Kenya mobile money)
 * - Stripe (global cards)
 * - Flutterwave / Paystack / Adyen (future expansion)
 *
 * THINK OF IT AS:
 * "Payment traffic controller", not a payment processor.
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
import { ProviderVO } from '../../domain/value-objects/provider.vo';

// Individual providers (already implemented)
import { MpesaProvider } from './mpesa.provider';
import { StripeProvider } from './stripe.provider';

@Injectable()
export class AggregatorProvider implements PaymentProviderPort {
  private readonly logger = new Logger(AggregatorProvider.name);

  constructor(
    private readonly mpesa: MpesaProvider,
    private readonly stripe: StripeProvider,
  ) {}

  // =====================================================
  // 🧠 ROUTING LOGIC (CORE OF AGGREGATION)
  // =====================================================

  private resolveProvider(input: InitiatePaymentInput) {
    /**
     * SIMPLE MVP ROUTING RULES:
     *
     * - KES + Kenya mobile → MPESA
     * - Cards / USD / EUR → Stripe
     *
     * Later upgrades:
     * - cost optimization
     * - success rate scoring
     * - geo-IP routing
     * - fallback chaining
     */

    const currency = input.amount.currency;

    if (currency === 'KES') {
      return ProviderVO.MPESA;
    }

    return ProviderVO.STRIPE;
  }

  // =====================================================
  // 💳 INITIATE PAYMENT (ROUTED)
  // =====================================================
  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    const provider = this.resolveProvider(input);

    this.logger.log(
      `[AGGREGATOR] Routing payment → ${provider.value} | user=${input.userId}`,
    );

    switch (provider.value) {
      case 'MPESA':
        return this.mpesa.initiatePayment(input);

      case 'STRIPE':
        return this.stripe.initiatePayment(input);

      default:
        throw new Error(`Unsupported provider: ${provider.value}`);
    }
  }

  // =====================================================
  // 🔍 VERIFY PAYMENT (ROUTED)
  // =====================================================
  async verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
    this.logger.log(`[AGGREGATOR] Verify payment ${paymentId}`);

    // ⚠️ MVP assumption:
    // We don't yet store provider mapping here.
    // Later: payment entity will carry provider reference.

    return this.stripe.verifyPayment(paymentId);
  }

  // =====================================================
  // 📩 WEBHOOK HANDLING (DELEGATED ENTRY POINT)
  // =====================================================
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    this.logger.log(
      `[AGGREGATOR] Webhook received from ${payload.provider}`,
    );

    switch (payload.provider) {
      case 'mpesa':
        return this.mpesa.handleWebhook(payload);

      case 'stripe':
        return this.stripe.handleWebhook(payload);

      default:
        this.logger.warn(
          `[AGGREGATOR] Unknown provider webhook: ${payload.provider}`,
        );
    }
  }

  // =====================================================
  // 💸 REFUND (ROUTED)
  // =====================================================
  async refund(input: RefundInput): Promise<void> {
    this.logger.log(`[AGGREGATOR] Refund for payment=${input.paymentId}`);

    // ⚠️ REAL SYSTEM:
    // You will route based on stored payment.provider

    return this.stripe.refund(input);
  }
}