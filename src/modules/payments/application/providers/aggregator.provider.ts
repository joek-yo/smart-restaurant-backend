import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProviderPort,
  InitiatePaymentInput,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookPayload,
  RefundInput,
} from './payment-provider.port';
import { PaymentProvider } from '../../domain/value-objects/provider.vo';
import { MpesaProvider } from './mpesa.provider';
import { StripeProvider } from './stripe.provider';

@Injectable()
export class AggregatorProvider implements PaymentProviderPort {
  private readonly logger = new Logger(AggregatorProvider.name);

  constructor(
    private readonly mpesa: MpesaProvider,
    private readonly stripe: StripeProvider,
  ) {}

  private resolveProvider(input: InitiatePaymentInput): PaymentProvider {
    return input.amount.curr === 'KES' ? PaymentProvider.MPESA : PaymentProvider.STRIPE;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    const provider = this.resolveProvider(input);
    this.logger.log(`[AGGREGATOR] Routing → ${provider} | user=${input.userId}`);

    switch (provider) {
      case PaymentProvider.MPESA:
        return this.mpesa.initiatePayment(input);
      case PaymentProvider.STRIPE:
        return this.stripe.initiatePayment(input);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  async verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
    return this.stripe.verifyPayment(paymentId);
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    switch (payload.provider) {
      case 'mpesa': return this.mpesa.handleWebhook(payload);
      case 'stripe': return this.stripe.handleWebhook(payload);
      default:
        this.logger.warn(`[AGGREGATOR] Unknown provider: ${payload.provider}`);
    }
  }

  async refund(input: RefundInput): Promise<void> {
    return this.stripe.refund(input);
  }
}
