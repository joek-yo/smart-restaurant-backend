import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentProviderPort,
  InitiatePaymentInput,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookPayload,
  RefundInput,
} from './payment-provider.port';
import { PaymentStatus, PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';

@Injectable()
export class MpesaProvider implements PaymentProviderPort {
  private readonly logger = new Logger(MpesaProvider.name);

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    this.logger.log(`[MPESA] STK Push | user=${input.userId} order=${input.orderId}`);

    const providerReference = this.buildProviderReference(
      input.orderId,
      input.amount.amount,
      input.customerReference,
    );

    return {
      paymentId: `mpesa-${input.orderId}-${Date.now()}`,
      providerReference,
      status: new PaymentStatusVO(PaymentStatus.INITIATED),
      raw: { message: 'STK Push initiated' },
    };
  }

  async verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
    this.logger.log(`[MPESA] Verify payment ${paymentId}`);
    return {
      paymentId,
      status: new PaymentStatusVO(PaymentStatus.PENDING_PROVIDER),
      providerReference: `verify-${paymentId}`,
    };
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    this.logger.log(`[MPESA] Webhook received`);
    if (!payload?.data) return;

    const data = payload.data;
    const providerReference = data.CheckoutRequestID;
    const alreadyProcessed = await this.checkIfAlreadyProcessed(providerReference);
    if (alreadyProcessed) {
      this.logger.warn(`[MPESA] Duplicate webhook ignored`);
      return;
    }

    if (data.ResultCode === 0) {
      this.logger.log(`[MPESA] PAYMENT SUCCESS`);
    } else {
      this.logger.warn(`[MPESA] PAYMENT FAILED`);
    }
  }

  async refund(input: RefundInput): Promise<void> {
    this.logger.log(`[MPESA] Refund ${input.paymentId}`);
    this.logger.warn(`Refund requires Safaricom reversal API integration`);
  }

  private buildProviderReference(orderId: string, amount: number, phone: string): string {
    return `MPESA-${orderId}-${amount}-${phone}`;
  }

  private async checkIfAlreadyProcessed(_providerRef: string): Promise<boolean> {
    return false;
  }
}
