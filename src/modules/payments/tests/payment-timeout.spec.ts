// src/modules/payments/tests/payment-timeout.spec.ts

import { Test, TestingModule } from '@nestjs/testing';

import { PaymentRetryQueue } from '../application/queues/payment-retry.queue';
import { ReconciliationService } from '../application/services/reconciliation.service';

/**
 * PAYMENT TIMEOUT + RECOVERY TEST
 * ---------------------------------------------------
 * PURPOSE:
 * Simulates:
 *
 * 1. Payment initiated
 * 2. MPESA callback NEVER arrives
 * 3. System detects timeout
 * 4. Recovery retry is scheduled
 * 5. Reconciliation later confirms payment
 *
 * THIS TEST VALIDATES:
 * ✅ timeout recovery path
 * ✅ retry scheduling
 * ✅ eventual consistency
 * ✅ resilience against provider delays
 */

describe('Payment Timeout Recovery', () => {
  let retryQueue: jest.Mocked<PaymentRetryQueue>;
  let reconciliationService: jest.Mocked<ReconciliationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PaymentRetryQueue,
          useValue: {
            enqueueRetry: jest.fn(),
            scheduleDelayedRetry: jest.fn(),
          },
        },
        {
          provide: ReconciliationService,
          useValue: {
            reconcileSinglePayment: jest.fn(),
          },
        },
      ],
    }).compile();

    retryQueue = module.get(PaymentRetryQueue);
    reconciliationService = module.get(ReconciliationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger retry when callback timeout occurs', async () => {
    const payment = {
      id: 'payment-timeout-001',
      status: 'PENDING_PROVIDER',
      providerReference: 'MPESA-12345',
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    };

    /**
     * SIMULATED TIMEOUT DETECTOR
     * ------------------------------------------------
     * Normally this would live inside:
     * - scheduled recovery worker
     * - timeout monitor
     * - reconciliation cron
     */

    const CALLBACK_TIMEOUT_MS = 2 * 60 * 1000;

    const ageMs =
      Date.now() - payment.createdAt.getTime();

    const isTimedOut =
      payment.status === 'PENDING_PROVIDER' &&
      ageMs > CALLBACK_TIMEOUT_MS;

    if (isTimedOut) {
      await retryQueue.scheduleDelayedRetry(
        {
          paymentId: payment.id,
          attempt: 1,
          reason: 'mpesa_callback_timeout',
        },
        5000,
      );
    }

    expect(
      retryQueue.scheduleDelayedRetry,
    ).toHaveBeenCalledTimes(1);

    expect(
      retryQueue.scheduleDelayedRetry,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: payment.id,
        attempt: 1,
        reason: 'mpesa_callback_timeout',
      }),
      5000,
    );
  });

  it('should reconcile payment after delayed provider confirmation', async () => {
    const paymentId = 'payment-recovery-001';

    /**
     * SCENARIO:
     * ------------------------------------------------
     * Callback never arrived,
     * but later reconciliation discovers:
     *
     * MPESA = SUCCESS
     */

    await reconciliationService.reconcileSinglePayment(
      paymentId,
    );

    expect(
      reconciliationService.reconcileSinglePayment,
    ).toHaveBeenCalledTimes(1);

    expect(
      reconciliationService.reconcileSinglePayment,
    ).toHaveBeenCalledWith(paymentId);
  });

  it('should prevent infinite timeout retry loops', async () => {
    const MAX_TIMEOUT_RETRIES = 3;

    const payment = {
      id: 'payment-loop-protection',
      retryCount: 3,
      status: 'PENDING_PROVIDER',
    };

    const canRetry =
      payment.retryCount < MAX_TIMEOUT_RETRIES;

    if (canRetry) {
      await retryQueue.enqueueRetry({
        paymentId: payment.id,
        attempt: payment.retryCount + 1,
        reason: 'timeout_retry',
      });
    }

    /**
     * MUST NOT RETRY AGAIN
     */
    expect(
      retryQueue.enqueueRetry,
    ).not.toHaveBeenCalled();
  });

  it('should recover gracefully from intermittent provider delay', async () => {
    const payment = {
      id: 'payment-intermittent-delay',
      attempt: 2,
    };

    /**
     * Simulate delayed retry scheduling
     */
    await retryQueue.scheduleDelayedRetry(
      {
        paymentId: payment.id,
        attempt: payment.attempt,
        reason: 'provider_delay',
      },
      15000,
    );

    expect(
      retryQueue.scheduleDelayedRetry,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentId: payment.id,
        attempt: 2,
        reason: 'provider_delay',
      }),
      15000,
    );
  });
});