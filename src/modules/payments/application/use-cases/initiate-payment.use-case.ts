// FILE: src/modules/payments/application/use-cases/initiate-payment.use-case.ts

/**
 * INITIATE PAYMENT USE CASE
 * -------------------------
 * Entry point for ALL payment flows.
 *
 * Responsibilities:
 * - Validate order existence (light validation only)
 * - Create Payment Entity (source of truth)
 * - Call Payment Orchestrator (DO NOT bypass)
 *
 * RULES:
 * - No provider logic here
 * - No business decisions here
 * - No event emission here
 * - Orchestrator owns execution flow
 */

import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PaymentOrchestratorService } from '../orchestrators/payment-orchestrator.service';
import { MoneyVO } from '../../domain/value-objects/money.vo';
import { PaymentStatusVO } from '../../domain/value-objects/payment-status.vo';

// (placeholder - will be replaced with real repository later)
interface OrderRepository {
  findById(orderId: string): Promise<any>;
}

@Injectable()
export class InitiatePaymentUseCase {
  private readonly logger = new Logger(InitiatePaymentUseCase.name);

  constructor(
    private readonly orchestrator: PaymentOrchestratorService,
    private readonly orderRepo: OrderRepository,
  ) {}

  // =====================================================
  // 🚀 MAIN ENTRY POINT
  // =====================================================
  async execute(input: {
    tenantId: string;
    userId: string;
    orderId: string;
    amount: number;
    currency: string;
    sessionId?: string;
    channel: string;
    idempotencyKey?: string;
  }) {
    this.logger.log(
      `[InitiatePayment] order=${input.orderId} tenant=${input.tenantId}`,
    );

    // ─────────────────────────────────────────────
    // 1. VALIDATE ORDER EXISTS
    // ─────────────────────────────────────────────
    const order = await this.orderRepo.findById(input.orderId);

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.tenantId !== input.tenantId) {
      throw new BadRequestException('Tenant mismatch for order');
    }

    // ─────────────────────────────────────────────
    // 2. BUILD MONEY VALUE OBJECT
    // ─────────────────────────────────────────────
    const amount = new MoneyVO(input.amount, input.currency);

    if (amount.value <= 0) {
      throw new BadRequestException('Invalid payment amount');
    }

    // ─────────────────────────────────────────────
    // 3. CALL ORCHESTRATOR (CORE BRAIN)
    // ─────────────────────────────────────────────
    const result = await this.orchestrator.initiatePayment(
      {
        tenantId: input.tenantId,
        userId: input.userId,
        orderId: input.orderId,
        sessionId: input.sessionId,
        channel: input.channel,
        idempotencyKey: input.idempotencyKey,
      },
      amount,
    );

    // ─────────────────────────────────────────────
    // 4. RETURN FINAL RESULT
    // ─────────────────────────────────────────────
    return {
      success: true,
      paymentId: result.paymentId,
      provider: result.provider,
      providerReference: result.providerReference,
      status: result.status ?? PaymentStatusVO.INITIATED,
    };
  }
}