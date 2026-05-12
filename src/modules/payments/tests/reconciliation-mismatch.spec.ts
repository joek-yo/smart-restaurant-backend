// src/modules/payments/tests/reconciliation-mismatch.spec.ts

describe('Payment Reconciliation Mismatch Recovery', () => {
  /**
   * =====================================================
   * TEST TYPES
   * =====================================================
   */

  type PaymentStatus =
    | 'PENDING'
    | 'SUCCESS'
    | 'FAILED';

  interface PaymentEntity {
    id: string;
    amount: number;
    providerReference: string;
    status: PaymentStatus;
    reconciled?: boolean;
    reconciledAt?: Date;
  }

  interface MpesaTransactionRecord {
    providerReference: string;
    receipt: string;
    status: PaymentStatus;
  }

  /**
   * =====================================================
   * FAKE PAYMENT REPOSITORY
   * =====================================================
   */

  class FakePaymentRepository {
    private readonly payments =
      new Map<string, PaymentEntity>();

    async save(
      payment: PaymentEntity,
    ): Promise<void> {
      this.payments.set(
        payment.id,
        payment,
      );
    }

    async findById(
      paymentId: string,
    ): Promise<
      PaymentEntity | undefined
    > {
      return this.payments.get(
        paymentId,
      );
    }
  }

  /**
   * =====================================================
   * FAKE LEDGER REPOSITORY
   * =====================================================
   */

  class FakeLedgerRepository {
    public readonly entries: any[] =
      [];

    async append(
      entry: any,
    ): Promise<void> {
      this.entries.push(entry);
    }
  }

  /**
   * =====================================================
   * FAKE MPESA PROVIDER
   * =====================================================
   */

  class FakeMpesaProvider {
    async queryTransaction(
      providerReference: string,
    ): Promise<MpesaTransactionRecord> {
      return {
        providerReference,
        receipt: 'QWE123XYZ',
        status: 'SUCCESS',
      };
    }
  }

  /**
   * =====================================================
   * SYSTEM UNDER TEST
   * =====================================================
   */

  class ReconciliationService {
    constructor(
      private readonly paymentRepo: FakePaymentRepository,
      private readonly ledgerRepo: FakeLedgerRepository,
      private readonly mpesaProvider: FakeMpesaProvider,
    ) {}

    async reconcilePayment(
      paymentId: string,
    ): Promise<void> {
      // =============================================
      // STEP 1: LOAD INTERNAL PAYMENT
      // =============================================
      const payment =
        await this.paymentRepo.findById(
          paymentId,
        );

      if (!payment) {
        throw new Error(
          'Payment not found',
        );
      }

      // =============================================
      // STEP 2: QUERY MPESA TRUTH
      // =============================================
      const mpesaRecord =
        await this.mpesaProvider.queryTransaction(
          payment.providerReference,
        );

      // =============================================
      // STEP 3: DETECT MISMATCH
      // =============================================
      const mismatch =
        payment.status !==
        mpesaRecord.status;

      if (!mismatch) {
        return;
      }

      // =============================================
      // STEP 4: AUTO-FIX
      // =============================================
      if (
        payment.status ===
          'PENDING' &&
        mpesaRecord.status ===
          'SUCCESS'
      ) {
        payment.status = 'SUCCESS';

        payment.reconciled = true;

        payment.reconciledAt =
          new Date();

        await this.paymentRepo.save(
          payment,
        );

        // =========================================
        // STEP 5: AUDIT LEDGER ENTRY
        // =========================================
        await this.ledgerRepo.append({
          paymentId: payment.id,
          type: 'RECONCILIATION_FIX',
          providerReference:
            payment.providerReference,
          receipt:
            mpesaRecord.receipt,
          previousStatus:
            'PENDING',
          correctedStatus:
            'SUCCESS',
          timestamp: new Date(),
        });
      }
    }
  }

  /**
   * =====================================================
   * TEST SETUP
   * =====================================================
   */

  let paymentRepo: FakePaymentRepository;

  let ledgerRepo: FakeLedgerRepository;

  let mpesaProvider: FakeMpesaProvider;

  let reconciliationService: ReconciliationService;

  beforeEach(() => {
    paymentRepo =
      new FakePaymentRepository();

    ledgerRepo =
      new FakeLedgerRepository();

    mpesaProvider =
      new FakeMpesaProvider();

    reconciliationService =
      new ReconciliationService(
        paymentRepo,
        ledgerRepo,
        mpesaProvider,
      );
  });

  /**
   * =====================================================
   * CORE RECONCILIATION TEST
   * =====================================================
   */

  it('should auto-fix payment when MPESA says SUCCESS but system says PENDING', async () => {
    // =============================================
    // INTERNAL SYSTEM STATE
    // =============================================
    const payment: PaymentEntity = {
      id: 'payment-001',
      amount: 2500,
      providerReference:
        'MPESA-REF-001',
      status: 'PENDING',
    };

    await paymentRepo.save(payment);

    // =============================================
    // RUN RECONCILIATION
    // =============================================
    await reconciliationService.reconcilePayment(
      payment.id,
    );

    // =============================================
    // ASSERTIONS
    // =============================================
    const updatedPayment =
      await paymentRepo.findById(
        payment.id,
      );

    expect(
      updatedPayment?.status,
    ).toBe('SUCCESS');

    expect(
      updatedPayment?.reconciled,
    ).toBe(true);

    expect(
      updatedPayment?.reconciledAt,
    ).toBeInstanceOf(Date);

    // Ledger audit trail exists
    expect(
      ledgerRepo.entries.length,
    ).toBe(1);

    expect(
      ledgerRepo.entries[0]
        .type,
    ).toBe(
      'RECONCILIATION_FIX',
    );

    expect(
      ledgerRepo.entries[0]
        .previousStatus,
    ).toBe('PENDING');

    expect(
      ledgerRepo.entries[0]
        .correctedStatus,
    ).toBe('SUCCESS');
  });

  /**
   * =====================================================
   * NO MISMATCH TEST
   * =====================================================
   */

  it('should NOT modify already-correct payments', async () => {
    const payment: PaymentEntity = {
      id: 'payment-correct',
      amount: 1000,
      providerReference:
        'MPESA-CORRECT-001',
      status: 'SUCCESS',
    };

    await paymentRepo.save(payment);

    await reconciliationService.reconcilePayment(
      payment.id,
    );

    const unchanged =
      await paymentRepo.findById(
        payment.id,
      );

    expect(
      unchanged?.status,
    ).toBe('SUCCESS');

    // No reconciliation ledger entry
    expect(
      ledgerRepo.entries.length,
    ).toBe(0);
  });

  /**
   * =====================================================
   * MISSING PAYMENT TEST
   * =====================================================
   */

  it('should fail safely when payment is missing', async () => {
    await expect(
      reconciliationService.reconcilePayment(
        'missing-payment',
      ),
    ).rejects.toThrow(
      'Payment not found',
    );
  });

  /**
   * =====================================================
   * AUDIT INTEGRITY TEST
   * =====================================================
   */

  it('should preserve reconciliation audit trail', async () => {
    const payment: PaymentEntity = {
      id: 'payment-audit',
      amount: 5000,
      providerReference:
        'MPESA-AUDIT-001',
      status: 'PENDING',
    };

    await paymentRepo.save(payment);

    await reconciliationService.reconcilePayment(
      payment.id,
    );

    const ledgerEntry =
      ledgerRepo.entries[0];

    expect(
      ledgerEntry.paymentId,
    ).toBe('payment-audit');

    expect(
      ledgerEntry.receipt,
    ).toBe('QWE123XYZ');

    expect(
      ledgerEntry.timestamp,
    ).toBeInstanceOf(Date);
  });

  /**
   * =====================================================
   * MULTIPLE PAYMENT RECOVERY
   * =====================================================
   */

  it('should reconcile multiple mismatched payments safely', async () => {
    const payments =
      Array.from(
        { length: 5 },
        (_, i) => ({
          id: `payment-${i}`,
          amount: 1000 + i,
          providerReference:
            `MPESA-${i}`,
          status:
            'PENDING' as PaymentStatus,
        }),
      );

    for (const payment of payments) {
      await paymentRepo.save(
        payment,
      );
    }

    await Promise.all(
      payments.map((payment) =>
        reconciliationService.reconcilePayment(
          payment.id,
        ),
      ),
    );

    for (const payment of payments) {
      const updated =
        await paymentRepo.findById(
          payment.id,
        );

      expect(
        updated?.status,
      ).toBe('SUCCESS');

      expect(
        updated?.reconciled,
      ).toBe(true);
    }

    expect(
      ledgerRepo.entries.length,
    ).toBe(5);
  });
});