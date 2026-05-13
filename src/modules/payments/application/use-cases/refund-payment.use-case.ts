// FILE: src/modules/payments/application/use-cases/refund-payment.use-case.ts

import { Injectable } from '@nestjs/common';
import { EventBus } from '@core/events';
import { PAYMENT_EVENTS, CHECKOUT_EVENTS } from '@core/events/event.constants';

import { PaymentRepository } from '../repositories/payment.repository';
import { PaymentStatus, PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';

/**
 * RefundPaymentUseCase
 * ---------------------
 * Handles full/partial refund lifecycle.
 *
 * IMPORTANT:
 * - This is provider-agnostic (MPESA, Stripe, Aggregator)
 * - Actual refund execution happens in provider.port implementation
 * - This use-case is domain + orchestration only
 */
@Injectable()
export class RefundPaymentUseCase {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: {
    paymentId: string;
    reason?: string;
    amount?: number; // optional for partial refunds
    initiatedBy?: string;
  }) {
    const payment = await this.paymentRepo.findById(input.paymentId);

    if (!payment) {
      throw new Error(`Payment not found: ${input.paymentId}`);
    }

    // =========================
    // BUSINESS RULES
    // =========================

    if (payment.status.value === PaymentStatus.REFUNDED) {
      throw new Error('Payment already fully refunded');
    }

    if (payment.status.value !== 'CONFIRMED') {
      throw new Error('Only confirmed payments can be refunded');
    }

    const refundAmount = input.amount ?? payment.amount;

    if (refundAmount <= 0) {
      throw new Error('Invalid refund amount');
    }

    if (refundAmount > payment.amount) {
      throw new Error('Refund cannot exceed original payment amount');
    }

    // =========================
    // STATE TRANSITION
    // =========================
    payment.status =
      refundAmount === payment.amount
        ? new PaymentStatusVO(PaymentStatus.REFUNDED)
        : new PaymentStatusVO(PaymentStatus.REFUNDED);

    payment.refundAmount = refundAmount;
    payment.refundReason = input.reason;
    payment.refundedAt = new Date();

    await this.paymentRepo.save(payment);

    // =========================
    // EVENT EMISSION
    // =========================
    this.eventBus.emit(PAYMENT_EVENTS.PAYMENT_REFUNDED, {
      paymentId: payment.id,
      tenantId: payment.tenantId,
      orderId: payment.orderId,
      amount: refundAmount,
      originalAmount: payment.amount,
      reason: input.reason,
      initiatedBy: input.initiatedBy,
      refundedAt: payment.refundedAt,
    });

    return {
      success: true,
      paymentId: payment.id,
      refundedAmount: refundAmount,
      status: payment.status.value,
    };
  }
}