// src/modules/payments/application/services/provider-fallback.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { PaymentProviderPort } from '../providers/payment-provider.port';
import { MpesaProvider } from '../providers/mpesa.provider';
import { StripeProvider } from '../providers/stripe.provider';

/**
 * Provider Fallback Service
 * --------------------------------
 * Purpose:
 * Switches between payment providers when primary fails.
 *
 * Strategy:
 * - Try MPESA first (Kenya default)
 * - If failure is critical → fallback to Stripe (future global)
 * - Eventually extend to aggregator (Flutterwave, Paystack, Adyen)
 *
 * This ensures:
 * - Payment continuity
 * - Reduced revenue loss
 * - Multi-region readiness
 */

export type PaymentProviderType = 'MPESA' | 'STRIPE';

@Injectable()
export class ProviderFallbackService {
  private readonly logger = new Logger(ProviderFallbackService.name);

  constructor(
    private readonly mpesaProvider: MpesaProvider,
    private readonly stripeProvider: StripeProvider,
  ) {}

  /**
   * Resolve best available provider
   */
  resolveProvider(primary: PaymentProviderType): PaymentProviderPort {
    switch (primary) {
      case 'MPESA':
        return this.mpesaProvider;
      case 'STRIPE':
        return this.stripeProvider;
      default:
        return this.mpesaProvider;
    }
  }

  /**
   * Execute payment with fallback logic
   */
  async executeWithFallback(
    primary: PaymentProviderType,
    payload: any,
  ): Promise<any> {
    const primaryProvider = this.resolveProvider(primary);

    try {
      this.logger.log(`🚀 Attempting payment via ${primary}`);

      return await primaryProvider.initiatePayment(payload);
    } catch (error) {
      this.logger.error(
        `❌ Primary provider failed: ${primary}`,
        error,
      );

      // fallback logic
      const fallbackProvider =
        primary === 'MPESA' ? this.stripeProvider : this.mpesaProvider;

      this.logger.warn(
        `🔁 Switching to fallback provider: ${
          primary === 'MPESA' ? 'STRIPE' : 'MPESA'
        }`,
      );

      return await fallbackProvider.initiatePayment(payload);
    }
  }
}