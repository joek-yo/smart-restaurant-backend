// FILE: src/modules/payments/application/providers/mpesa.provider.ts

import {
  PaymentProviderPort,
  InitiatePaymentInput,
  InitiatePaymentResult,
  VerifyPaymentResult,
  WebhookPayload,
  RefundInput,
} from './payment-provider.port';

import { Injectable, Logger } from '@nestjs/common';
import { PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';

@Injectable()
export class MpesaProvider implements PaymentProviderPort {
  private readonly logger = new Logger(MpesaProvider.name);

  // =====================================================
  // 🔐 INITIATE STK PUSH (SAFE VERSION)
  // =====================================================
  async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<InitiatePaymentResult> {
    this.logger.log(
      `[MPESA] STK Push | user=${input.userId} order=${input.orderId}`,
    );

    /**
     * IMPORTANT IMPROVEMENT:
     * Use deterministic provider reference for idempotency safety
     */
    const providerReference = this.buildProviderReference(
      input.orderId,
      input.amount,
      input.phoneNumber,
    );

    return {
      paymentId: input.paymentId, // MUST COME FROM DOMAIN (NOT GENERATED HERE)
      providerReference,
      status: PaymentStatusVO.INITIATED,
      raw: {
        message: 'STK Push initiated (replace with Safaricom API)',
      },
    };
  }

  // =====================================================
  // 🔍 VERIFY PAYMENT STATUS
  // =====================================================
  async verifyPayment(paymentId: string): Promise<VerifyPaymentResult> {
    this.logger.log(`[MPESA] Verify payment ${paymentId}`);

    return {
      paymentId,
      status: PaymentStatusVO.PENDING_PROVIDER,
      providerReference: `verify-${paymentId}`,
    };
  }

  // =====================================================
  // 📩 WEBHOOK HANDLER (CRITICAL PATH)
  // =====================================================
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    this.logger.log(`[MPESA] Webhook received`);

    /**
     * 🔐 STEP 1: Validate structure
     */
    if (!payload?.data) return;

    const data = payload.data;

    const resultCode = data.ResultCode;
    const receipt = data.MpesaReceiptNumber;
    const amount = data.Amount;
    const phone = data.PhoneNumber;

    /**
     * 🚨 STEP 2: IDENTITY CORRELATION
     * MUST map provider reference → internal payment
     *
     * (This is where PaymentRepository lookup happens)
     */

    const providerReference = data.CheckoutRequestID;

    /**
     * 🚨 STEP 3: IDEMPOTENCY CHECK (CRITICAL)
     * Prevent duplicate webhook processing
     */

    const alreadyProcessed = await this.checkIfAlreadyProcessed(
      providerReference,
      receipt,
    );

    if (alreadyProcessed) {
      this.logger.warn(`[MPESA] Duplicate webhook ignored`);
      return;
    }

    /**
     * STEP 4: PROCESS RESULT
     */
    if (resultCode === 0) {
      this.logger.log(`[MPESA] PAYMENT SUCCESS`);

      // Emit: PaymentConfirmedEvent
      // Update ledger
      // Mark idempotency record
    } else {
      this.logger.warn(`[MPESA] PAYMENT FAILED`);

      // Emit: PaymentFailedEvent
      // Trigger retry queue if needed
    }
  }

  // =====================================================
  // 💸 REFUND (PLACEHOLDER)
  // =====================================================
  async refund(input: RefundInput): Promise<void> {
    this.logger.log(`[MPESA] Refund ${input.paymentId}`);

    this.logger.warn(`Refund requires Safaricom reversal API integration`);
  }

  // =====================================================
  // 🧠 INTERNAL HELPERS
  // =====================================================

  private buildProviderReference(
    orderId: string,
    amount: number,
    phone: string,
  ): string {
    return `MPESA-${orderId}-${amount}-${phone}`;
  }

  private async checkIfAlreadyProcessed(
    providerRef: string,
    receipt?: string,
  ): Promise<boolean> {
    /**
     * THIS MUST CONNECT TO:
     * - payment-idempotency.entity
     * - reconciliation log
     * - payment ledger
     */
    return false; // placeholder
  }
}