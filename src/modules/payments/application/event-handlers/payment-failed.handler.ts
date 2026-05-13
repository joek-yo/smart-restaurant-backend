// FILE: src/modules/payments/application/event-handlers/payment-failed.handler.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '@core/events';
import { PAYMENT_EVENTS, CHECKOUT_EVENTS } from '@core/events/event.constants';

import { WhatsappGateway } from '@modules/whatsapp/gateway/whatsapp.gateway';
import { PaymentRepository } from '../repositories/payment.repository';

/**
 * PaymentFailedHandler
 * ---------------------
 * Side-effect engine for failed payments.
 *
 * RESPONSIBILITIES:
 * - Notify user of failure
 * - Schedule retry (STK push / provider retry)
 * - Persist failure insights (optional analytics)
 */
@Injectable()
export class PaymentFailedHandler implements OnModuleInit {
  private readonly logger = new Logger(PaymentFailedHandler.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly paymentRepo: PaymentRepository,
    private readonly whatsappGateway: WhatsappGateway,
  ) {}

  onModuleInit() {
    this.eventBus.on(PAYMENT_EVENTS.PAYMENT_FAILED, this.handle.bind(this));
  }

  async handle(event: {
    paymentId: string;
    tenantId: string;
    orderId?: string;
    reason: string;
    provider: string;
    retryable?: boolean;
    attemptCount?: number;
  }) {
    this.logger.warn(
      `[PaymentFailed] payment=${event.paymentId} tenant=${event.tenantId} reason=${event.reason}`,
    );

    // =========================
    // 1. LOAD PAYMENT
    // =========================
    const payment = await this.paymentRepo.findById(event.paymentId);

    if (!payment) {
      this.logger.error(`Payment not found: ${event.paymentId}`);
      return;
    }

    // =========================
    // 2. UPDATE FAILURE STATE
    // =========================
    payment.lastFailureReason = event.reason;
    payment.lastFailedAt = new Date();
    payment.retryCount = (payment.retryCount || 0) + 1;

    await this.paymentRepo.save(payment);

    // =========================
    // 3. USER NOTIFICATION (WHATSAPP)
    // =========================
    await this.whatsappGateway.server?.emit('outgoingMessage', {
      tenantId: event.tenantId,
      message:
        `❌ Payment failed.\nReason: ${event.reason}\n` +
        `We are trying to resolve it or you may retry.`,
      meta: {
        paymentId: event.paymentId,
        retryable: event.retryable,
      },
    });

    // =========================
    // 4. RETRY LOGIC (FUTURE EXTENSION POINT)
    // =========================
    if (event.retryable && payment.retryCount < 3) {
      this.logger.log(
        `[PaymentRetry] scheduling retry #${payment.retryCount} for ${event.paymentId}`,
      );

      // NOTE:
      // In production this should go to:
      // - BullMQ / RabbitMQ / Kafka delayed queue
      // NOT immediate recursion
      //
      // Example placeholder:
      // await this.paymentRetryQueue.add('retry-payment', {
      //   paymentId: event.paymentId,
      //   delay: 30000,
      // });
    } else {
      this.logger.warn(
        `[PaymentFailed] max retries reached or not retryable: ${event.paymentId}`,
      );
    }

    // =========================
    // 5. ANALYTICS HOOK (FUTURE)
    // =========================
    // - failure rate tracking
    // - provider reliability scoring
  }
}