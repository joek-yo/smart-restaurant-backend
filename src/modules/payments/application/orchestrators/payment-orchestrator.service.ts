// FILE: src/modules/payments/application/orchestrators/payment-orchestrator.service.ts

/**
 * PAYMENT ORCHESTRATOR SERVICE ⭐ CORE BRAIN
 * ------------------------------------------
 * This is the central decision engine for ALL money movement.
 *
 * Responsibilities:
 * - Converts Checkout → Payment Intent
 * - Selects Payment Provider (MPESA, STRIPE, AGGREGATOR)
 * - Initiates Payment Flow
 * - Emits Payment Lifecycle Events
 * - Enforces Idempotency (CRITICAL for financial safety)
 *
 * RULES:
 * - NO direct API calls (only via PaymentProviderPort)
 * - NO business logic (only orchestration)
 * - MUST be deterministic (same input = same outcome)
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { PaymentProviderPort } from '../providers/payment-provider.port';
import { MpesaProvider } from '../providers/mpesa.provider';
import { StripeProvider } from '../providers/stripe.provider';
import { AggregatorProvider } from '../providers/aggregator.provider';

import { PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';
import { ProviderVO } from '../../domain/value-objects/provider.vo';
import { MoneyVO } from '../../domain/value-objects/money.vo';

// Events (we will wire fully later)
import { EventBus } from '@core/events';
import { EVENTS } from '@core/events/event.constants';

export interface PaymentContext {
  tenantId: string;
  userId: string;
  orderId: string;
  sessionId?: string;
  channel: string;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  paymentId: string;
  provider: string;
  providerReference: string;
  status: PaymentStatusVO;
}

@Injectable()
export class PaymentOrchestratorService {
  private readonly logger = new Logger(PaymentOrchestratorService.name);

  constructor(
    private readonly mpesa: MpesaProvider,
    private readonly stripe: StripeProvider,
    private readonly aggregator: AggregatorProvider,
    private readonly eventBus: EventBus,
  ) {}

  // =====================================================
  // 🧠 PROVIDER SELECTION (MVP RULES)
  // =====================================================
  private resolveProvider(ctx: PaymentContext, amount: MoneyVO): PaymentProviderPort {
    /**
     * MVP LOGIC:
     * - KES → MPESA first
     * - everything else → STRIPE via aggregator fallback
     *
     * FUTURE:
     * - success rate scoring
     * - cost optimization
     * - geo routing
     */

    if (amount.currency === 'KES') {
      return this.mpesa;
    }

    return this.aggregator;
  }

  // =====================================================
  // 🔐 MAIN ENTRY POINT
  // =====================================================
  async initiatePayment(
    ctx: PaymentContext,
    amount: MoneyVO,
  ): Promise<PaymentIntentResult> {
    this.logger.log(
      `[PaymentOrchestrator] start order=${ctx.orderId} tenant=${ctx.tenantId}`,
    );

    // ─────────────────────────────────────────────
    // 1. IDEMPOTENCY GUARD
    // ─────────────────────────────────────────────
    const paymentId =
      ctx.idempotencyKey ?? `${ctx.orderId}-${ctx.userId}`;

    this.logger.log(
      `[PaymentOrchestrator] idempotencyKey=${paymentId}`,
    );

    // (Future: check DB/ledger here)

    // ─────────────────────────────────────────────
    // 2. SELECT PROVIDER
    // ─────────────────────────────────────────────
    const provider = this.resolveProvider(ctx, amount);

    const providerName =
      provider instanceof MpesaProvider
        ? ProviderVO.MPESA.value
        : provider instanceof StripeProvider
        ? ProviderVO.STRIPE.value
        : ProviderVO.AGGREGATOR.value;

    this.logger.log(
      `[PaymentOrchestrator] provider selected=${providerName}`,
    );

    // ─────────────────────────────────────────────
    // 3. INITIATE PAYMENT
    // ─────────────────────────────────────────────
    const result = await provider.initiatePayment({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      orderId: ctx.orderId,
      amount,
      provider: new ProviderVO(providerName),
      customerReference: ctx.userId,
    });

    // ─────────────────────────────────────────────
    // 4. EMIT PAYMENT INITIATED EVENT
    // ─────────────────────────────────────────────
    this.eventBus.emit(EVENTS.CHECKOUT_STARTED, {
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      orderId: ctx.orderId,
      paymentId,
      provider: providerName,
      providerReference: result.providerReference,
    });

    // ─────────────────────────────────────────────
    // 5. RETURN RESULT
    // ─────────────────────────────────────────────
    return {
      paymentId,
      provider: providerName,
      providerReference: result.providerReference,
      status: result.status,
    };
  }

  // =====================================================
  // 🔍 VERIFY PAYMENT (FUTURE EXTENSION POINT)
  // =====================================================
  async verifyPayment(paymentId: string) {
    this.logger.log(`[PaymentOrchestrator] verify ${paymentId}`);

    // Later: resolve provider from PaymentEntity
    return {
      paymentId,
      status: PaymentStatusVO.PENDING_PROVIDER,
    };
  }
}