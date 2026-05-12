// src/modules/payments/tests/payment-idempotency.spec.ts

import { ConflictException } from '@nestjs/common';

describe('Payment Idempotency System', () => {
  /**
   * =====================================================
   * TEST DOUBLES
   * =====================================================
   */

  class FakePaymentRepository {
    private readonly payments: any[] = [];

    async create(payment: any) {
      this.payments.push(payment);
      return payment;
    }

    async count(): Promise<number> {
      return this.payments.length;
    }

    async findAll() {
      return this.payments;
    }
  }

  class FakeIdempotencyRepository {
    private readonly keys = new Map<string, any>();

    async find(key: string) {
      return this.keys.get(key);
    }

    async save(key: string, value: any) {
      if (this.keys.has(key)) {
        throw new ConflictException(
          'Duplicate idempotency key detected',
        );
      }

      this.keys.set(key, value);
    }
  }

  /**
   * =====================================================
   * SYSTEM UNDER TEST
   * =====================================================
   */

  class PaymentService {
    constructor(
      private readonly paymentRepo: FakePaymentRepository,
      private readonly idempotencyRepo: FakeIdempotencyRepository,
    ) {}

    async initiateCheckout(params: {
      idempotencyKey: string;
      orderId: string;
      amount: number;
    }) {
      // =================================================
      // STEP 1: CHECK EXISTING IDEMPOTENCY RECORD
      // =================================================
      const existing =
        await this.idempotencyRepo.find(
          params.idempotencyKey,
        );

      if (existing) {
        return existing;
      }

      // =================================================
      // STEP 2: CREATE PAYMENT
      // =================================================
      const payment = {
        id: `payment-${Date.now()}`,
        orderId: params.orderId,
        amount: params.amount,
        status: 'INITIATED',
      };

      // =================================================
      // STEP 3: SAVE IDEMPOTENCY RECORD
      // =================================================
      await this.idempotencyRepo.save(
        params.idempotencyKey,
        payment,
      );

      // =================================================
      // STEP 4: SAVE PAYMENT
      // =================================================
      await this.paymentRepo.create(payment);

      return payment;
    }
  }

  /**
   * =====================================================
   * TEST SETUP
   * =====================================================
   */

  let paymentRepo: FakePaymentRepository;
  let idempotencyRepo: FakeIdempotencyRepository;
  let paymentService: PaymentService;

  beforeEach(() => {
    paymentRepo = new FakePaymentRepository();

    idempotencyRepo =
      new FakeIdempotencyRepository();

    paymentService = new PaymentService(
      paymentRepo,
      idempotencyRepo,
    );
  });

  /**
   * =====================================================
   * CORE TEST
   * =====================================================
   */

  it('should create ONLY ONE payment for duplicate checkout clicks', async () => {
    const payload = {
      idempotencyKey:
        'checkout-user-123-order-456',
      orderId: 'order-456',
      amount: 2500,
    };

    // =================================================
    // SIMULATE DOUBLE CLICK / DUPLICATE REQUEST
    // =================================================
    const [firstRequest, secondRequest] =
      await Promise.all([
        paymentService.initiateCheckout(payload),
        paymentService.initiateCheckout(payload),
      ]);

    // =================================================
    // ASSERTIONS
    // =================================================

    // Same payment returned
    expect(firstRequest.id).toBe(
      secondRequest.id,
    );

    // Only ONE payment persisted
    const paymentCount =
      await paymentRepo.count();

    expect(paymentCount).toBe(1);

    // Payment integrity
    const storedPayments =
      await paymentRepo.findAll();

    expect(storedPayments[0].orderId).toBe(
      'order-456',
    );

    expect(storedPayments[0].amount).toBe(
      2500,
    );

    expect(storedPayments[0].status).toBe(
      'INITIATED',
    );
  });

  /**
   * =====================================================
   * ADDITIONAL HARDENING TESTS
   * =====================================================
   */

  it('should allow different idempotency keys', async () => {
    await paymentService.initiateCheckout({
      idempotencyKey: 'key-1',
      orderId: 'order-1',
      amount: 100,
    });

    await paymentService.initiateCheckout({
      idempotencyKey: 'key-2',
      orderId: 'order-2',
      amount: 200,
    });

    const paymentCount =
      await paymentRepo.count();

    expect(paymentCount).toBe(2);
  });

  it('should return existing payment on replay', async () => {
    const payload = {
      idempotencyKey: 'stable-key',
      orderId: 'order-999',
      amount: 5000,
    };

    const original =
      await paymentService.initiateCheckout(
        payload,
      );

    const replay =
      await paymentService.initiateCheckout(
        payload,
      );

    expect(replay.id).toBe(original.id);

    const paymentCount =
      await paymentRepo.count();

    expect(paymentCount).toBe(1);
  });

  it('should resist retry storms', async () => {
    const payload = {
      idempotencyKey: 'storm-key',
      orderId: 'order-storm',
      amount: 999,
    };

    // Simulate 25 concurrent retries
    const requests = Array.from(
      { length: 25 },
      () =>
        paymentService.initiateCheckout(
          payload,
        ),
    );

    const responses =
      await Promise.all(requests);

    const ids = new Set(
      responses.map((r) => r.id),
    );

    // All responses should reference same payment
    expect(ids.size).toBe(1);

    // DB should still contain only one payment
    const paymentCount =
      await paymentRepo.count();

    expect(paymentCount).toBe(1);
  });
});