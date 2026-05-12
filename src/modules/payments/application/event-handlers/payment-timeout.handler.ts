// src/modules/payments/application/event-handlers/payment-timeout.handler.ts

import { Injectable, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';

/**
 * Payment Timeout Handler
 * --------------------------------
 * Purpose:
 * Handles payments that remain stuck in PENDING_PROVIDER
 * beyond expected MPESA response window.
 *
 * Why this exists:
 * - MPESA callbacks can be delayed or never arrive
 * - Network issues may drop confirmation events
 * - Provider may accept payment but not notify system
 *
 * This ensures:
 * - No "infinite pending" payments
 * - System consistency is maintained
 * - Reconciliation + retry can take over
 */

export class PaymentTimeoutEvent {
  constructor(public readonly paymentId: string) {}
}

@Injectable()
@EventsHandler(PaymentTimeoutEvent)
export class PaymentTimeoutHandler
  implements IEventHandler<PaymentTimeoutEvent>
{
  private readonly logger = new Logger(PaymentTimeoutHandler.name);

  constructor(private readonly paymentRepo: PaymentRepository) {}

  async handle(event: PaymentTimeoutEvent) {
    const { paymentId } = event;

    this.logger.warn(`⏰ Payment timeout triggered | paymentId=${paymentId}`);

    const payment = await this.paymentRepo.findById(paymentId);

    if (!payment) {
      this.logger.error(`Payment not found | paymentId=${paymentId}`);
      return;
    }

    // Only process stuck payments
    if (payment.status !== 'PENDING_PROVIDER') {
      this.logger.log(
        `Skipping timeout handling | payment already in state=${payment.status}`,
      );
      return;
    }

    // Mark as timeout state
    payment.markAsTimeout(); // sets PENDING_TIMEOUT internally

    await this.paymentRepo.save(payment);

    this.logger.warn(
      `⚠️ Payment marked as PENDING_TIMEOUT | paymentId=${paymentId}`,
    );

    /**
     * Next system actions (handled elsewhere):
     * - Retry queue activation
     * - Reconciliation check
     * - User notification (WhatsApp/SMS)
     */
  }
}