// FILE: src/modules/payments/application/use-cases/confirm-payment.use-case.ts

import { Injectable } from '@nestjs/common';
import { EventBus } from '@core/events';
import { EVENTS } from '@core/events/event.constants';

import { PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';
import { PaymentRepository } from '../../domain/repositories/payment.repository';

/**
 * ConfirmPaymentUseCase
 * ----------------------
 * Handles successful payment confirmation coming from provider/webhook.
 *
 * Responsibilities:
 * - Validate payment exists
 * - Update payment state to CONFIRMED
 * - Persist state change
 * - Emit domain event for downstream systems
 */
@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: {
    paymentId: string;
    providerRef?: string;
    metadata?: Record<string, any>;
  }) {
    const payment = await this.paymentRepo.findById(input.paymentId);

    if (!payment) {
      throw new Error(`Payment not found: ${input.paymentId}`);
    }

    // =========================
    // DOMAIN STATE TRANSITION
    // =========================
    payment.status = new PaymentStatusVO('CONFIRMED');
    payment.providerRef = input.providerRef ?? payment.providerRef;
    payment.confirmedAt = new Date();

    await this.paymentRepo.save(payment);

    // =========================
    // EVENT EMISSION
    // =========================
    this.eventBus.emit(EVENTS.PAYMENT_CONFIRMED, {
      paymentId: payment.id,
      tenantId: payment.tenantId,
      orderId: payment.orderId,
      amount: payment.amount,
      provider: payment.provider,
      providerRef: payment.providerRef,
      metadata: input.metadata,
      confirmedAt: payment.confirmedAt,
    });

    return {
      success: true,
      paymentId: payment.id,
      status: payment.status.value,
    };
  }
}