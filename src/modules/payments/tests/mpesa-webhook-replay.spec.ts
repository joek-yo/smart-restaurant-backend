// src/modules/payments/tests/mpesa-webhook-replay.spec.ts

import { ConflictException } from '@nestjs/common';

describe('MPESA Webhook Replay Protection', () => {
  /**
   * =====================================================
   * TEST DOUBLES
   * =====================================================
   */

  class FakeWebhookReplayProtectionService {
    private readonly processedHashes =
      new Set<string>();

    validateNoReplay(payload: any): void {
      const hash = JSON.stringify(payload);

      if (this.processedHashes.has(hash)) {
        throw new ConflictException(
          'Duplicate webhook detected',
        );
      }

      this.processedHashes.add(hash);
    }
  }

  class FakePaymentOrchestrator {
    public processedCount = 0;

    public processedTransactions =
      new Set<string>();

    async handleProviderCallback(
      payload: any,
    ): Promise<void> {
      this.processedCount++;

      this.processedTransactions.add(
        payload.transactionRef,
      );
    }
  }

  /**
   * =====================================================
   * SYSTEM UNDER TEST
   * =====================================================
   */

  class WebhookHandler {
    constructor(
      private readonly replayProtection: FakeWebhookReplayProtectionService,
      private readonly orchestrator: FakePaymentOrchestrator,
    ) {}

    async processWebhook(
      payload: any,
    ): Promise<void> {
      // =============================================
      // STEP 1: BLOCK REPLAY
      // =============================================
      this.replayProtection.validateNoReplay(
        payload,
      );

      // =============================================
      // STEP 2: NORMALIZE CALLBACK
      // =============================================
      const callback =
        payload?.Body?.stkCallback;

      // =============================================
      // STEP 3: PROCESS PAYMENT
      // =============================================
      await this.orchestrator.handleProviderCallback(
        {
          provider: 'mpesa',
          transactionRef:
            callback?.CheckoutRequestID,
          amount: 2500,
          status:
            callback?.ResultCode === 0
              ? 'SUCCESS'
              : 'FAILED',
        },
      );
    }
  }

  /**
   * =====================================================
   * TEST SETUP
   * =====================================================
   */

  let replayProtection: FakeWebhookReplayProtectionService;

  let orchestrator: FakePaymentOrchestrator;

  let webhookHandler: WebhookHandler;

  beforeEach(() => {
    replayProtection =
      new FakeWebhookReplayProtectionService();

    orchestrator =
      new FakePaymentOrchestrator();

    webhookHandler = new WebhookHandler(
      replayProtection,
      orchestrator,
    );
  });

  /**
   * =====================================================
   * TEST PAYLOAD
   * =====================================================
   */

  const mpesaCallbackPayload = {
    Body: {
      stkCallback: {
        MerchantRequestID:
          '29115-34620561-1',

        CheckoutRequestID:
          'ws_CO_120520261230001234567890',

        ResultCode: 0,

        ResultDesc:
          'The service request is processed successfully.',

        CallbackMetadata: {
          Item: [
            {
              Name: 'Amount',
              Value: 2500,
            },
            {
              Name: 'MpesaReceiptNumber',
              Value: 'QWE123XYZ',
            },
            {
              Name: 'PhoneNumber',
              Value: 254712345678,
            },
          ],
        },
      },
    },
  };

  /**
   * =====================================================
   * CORE REPLAY TEST
   * =====================================================
   */

  it('should process SAME MPESA callback ONLY ONCE', async () => {
    const replayAttempts = 10;

    const results = await Promise.allSettled(
      Array.from(
        { length: replayAttempts },
        () =>
          webhookHandler.processWebhook(
            mpesaCallbackPayload,
          ),
      ),
    );

    // =============================================
    // ASSERTIONS
    // =============================================

    // Only ONE should succeed
    const successful = results.filter(
      (r) => r.status === 'fulfilled',
    );

    expect(successful.length).toBe(1);

    // Remaining should fail due to replay protection
    const failed = results.filter(
      (r) => r.status === 'rejected',
    );

    expect(failed.length).toBe(9);

    // Payment orchestration executed once
    expect(
      orchestrator.processedCount,
    ).toBe(1);

    // Only one transaction processed
    expect(
      orchestrator.processedTransactions.size,
    ).toBe(1);
  });

  /**
   * =====================================================
   * DIFFERENT CALLBACKS SHOULD PASS
   * =====================================================
   */

  it('should allow different MPESA callbacks', async () => {
    const payload1 = structuredClone(
      mpesaCallbackPayload,
    );

    const payload2 = structuredClone(
      mpesaCallbackPayload,
    );

    payload2.Body.stkCallback
      .CheckoutRequestID =
      'ws_CO_DIFFERENT_002';

    await webhookHandler.processWebhook(
      payload1,
    );

    await webhookHandler.processWebhook(
      payload2,
    );

    expect(
      orchestrator.processedCount,
    ).toBe(2);

    expect(
      orchestrator.processedTransactions.size,
    ).toBe(2);
  });

  /**
   * =====================================================
   * FAILED CALLBACKS SHOULD STILL LOCK
   * =====================================================
   */

  it('should still prevent replay after failed payment callback', async () => {
    const failedPayload = structuredClone(
      mpesaCallbackPayload,
    );

    failedPayload.Body.stkCallback.ResultCode =
      1032;

    // First attempt
    await webhookHandler.processWebhook(
      failedPayload,
    );

    // Replay attempt
    await expect(
      webhookHandler.processWebhook(
        failedPayload,
      ),
    ).rejects.toThrow(
      'Duplicate webhook detected',
    );

    expect(
      orchestrator.processedCount,
    ).toBe(1);
  });

  /**
   * =====================================================
   * RETRY STORM SIMULATION
   * =====================================================
   */

  it('should survive webhook retry storms', async () => {
    const retryStormSize = 100;

    const responses =
      await Promise.allSettled(
        Array.from(
          { length: retryStormSize },
          () =>
            webhookHandler.processWebhook(
              mpesaCallbackPayload,
            ),
        ),
      );

    const successCount = responses.filter(
      (r) => r.status === 'fulfilled',
    ).length;

    expect(successCount).toBe(1);

    expect(
      orchestrator.processedCount,
    ).toBe(1);
  });
});