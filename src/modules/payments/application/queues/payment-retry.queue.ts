// src/modules/payments/application/queues/payment-retry.queue.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';

export interface PaymentRetryJobPayload {
  paymentId: string;
  attempt: number;
  reason: string;
}

@Injectable()
export class PaymentRetryQueue {
  private readonly logger = new Logger(PaymentRetryQueue.name);

  constructor(
    @InjectQueue('payment-retry-queue')
    private readonly queue: Queue,
  ) {}

  /**
   * 🔁 MAIN RETRY ENQUEUE (HARDENED)
   *
   * FIXES:
   * - deterministic jobId (prevents duplicates)
   * - idempotent retry scheduling
   * - safe overwrite behavior
   */
  async enqueueRetry(payload: PaymentRetryJobPayload) {
    const jobId = this.buildJobId(payload.paymentId, payload.attempt);

    this.logger.warn(
      `🔁 Enqueuing retry | paymentId=${payload.paymentId} | attempt=${payload.attempt}`,
    );

    await this.queue.add(
      'retry-payment',
      payload,
      {
        jobId, // 🚨 CRITICAL: prevents duplicate jobs
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: this.calculateBackoff(payload.attempt),
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  /**
   * ⏳ DELAYED RETRY (WEBHOOK / MPESA LAG SAFE)
   *
   * FIXES:
   * - deterministic jobId per payment + delay bucket
   * - prevents duplicate delayed retries
   */
  async scheduleDelayedRetry(
    payload: PaymentRetryJobPayload,
    delayMs: number,
  ) {
    const jobId = `delayed:${payload.paymentId}:${payload.attempt}:${delayMs}`;

    this.logger.log(
      `⏳ Scheduling delayed retry | paymentId=${payload.paymentId} | delay=${delayMs}ms`,
    );

    await this.queue.add(
      'delayed-retry-payment',
      payload,
      {
        jobId, // 🚨 prevents duplicate delayed scheduling
        delay: delayMs,
        attempts: 3,
        backoff: {
          type: 'fixed',
          delay: 3000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  /**
   * 🧠 DEDUPLICATION STRATEGY
   * Stable identity for retry jobs
   */
  private buildJobId(paymentId: string, attempt: number): string {
    return `retry:${paymentId}:${attempt}`;
  }

  /**
   * 📈 BACKOFF STRATEGY (SAFE EXPONENTIAL CONTROL)
   *
   * Prevents runaway retry storms
   */
  private calculateBackoff(attempt: number): number {
    const base = 5000;

    // exponential but capped (prevents infinite delay growth)
    const delay = base * Math.pow(2, attempt);

    // hard cap at 2 minutes
    return Math.min(delay, 120000);
  }
}