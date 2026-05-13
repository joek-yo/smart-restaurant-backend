// FILE: src/modules/protection/application/services/payment-protection.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';
import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

/**
 * PaymentProtectionService
 * ------------------------
 * Enforces safety rules around payment execution:
 * - prevents duplicate charges
 * - ensures valid payment state transitions
 * - detects inconsistent payment workflows
 * - flags unsafe payment retries
 *
 * This service MUST NEVER execute payments.
 * It only validates + flags anomalies.
 */
@Injectable()
export class PaymentProtectionService {
  private readonly logger = new Logger(PaymentProtectionService.name);

  // ==================================================
  // 🔒 VALIDATE PAYMENT READINESS
  // ==================================================
  validatePaymentReadiness(input: {
    paymentId: string;
    tenantId: string;
    userId: string;
    orderId: string;
    amount: number;
    currency?: string;
    state: string;
  }): WorkflowAnomalyEntity | null {
    if (!input.orderId) {
      return this.anomaly(
        input,
        WorkflowAnomalyType.STATE_CORRUPTION,
        ProtectionLevel.CRITICAL,
        'MISSING_ORDER_ID',
      );
    }

    if (input.amount <= 0) {
      return this.anomaly(
        input,
        WorkflowAnomalyType.STATE_CORRUPTION,
        ProtectionLevel.FATAL,
        'INVALID_AMOUNT',
      );
    }

    return null;
  }

  // ==================================================
  // 🔁 VALIDATE PAYMENT STATE TRANSITIONS
  // ==================================================
  validateTransition(input: {
    paymentId: string;
    tenantId: string;
    userId: string;
    from: string;
    to: string;
  }): WorkflowAnomalyEntity | null {
    const allowed: Record<string, string[]> = {
      CREATED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SUCCEEDED', 'FAILED'],
      FAILED: ['PROCESSING'], // retry allowed
      SUCCEEDED: [],
      CANCELLED: [],
    };

    const allowedNext = allowed[input.from] ?? [];

    if (!allowedNext.includes(input.to)) {
      this.logger.error(
        `[PROTECTION] invalid payment transition ${input.from} → ${input.to}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.paymentId}:INVALID_PAYMENT_TRANSITION`,
        input.tenantId,
        input.paymentId,
        WorkflowAnomalyType.INVALID_TRANSITION,
        ProtectionLevel.CRITICAL,
        {
          from: input.from,
          to: input.to,
          userId: input.userId,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🚨 DETECT DOUBLE PAYMENT ATTEMPT
  // ==================================================
  detectDuplicatePayment(input: {
    paymentId: string;
    orderId: string;
    tenantId: string;
    userId: string;
    isAlreadyProcessed: boolean;
  }): WorkflowAnomalyEntity | null {
    if (input.isAlreadyProcessed) {
      this.logger.warn(
        `[PROTECTION] duplicate payment attempt payment=${input.paymentId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.paymentId}:DUPLICATE_PAYMENT`,
        input.tenantId,
        input.paymentId,
        WorkflowAnomalyType.DUPLICATE_MESSAGE,
        ProtectionLevel.FATAL,
        {
          orderId: input.orderId,
          userId: input.userId,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🧠 CHECK PAYMENT RECOVERABILITY
  // ==================================================
  isRecoverable(input: {
    state: string;
  }): boolean {
    const terminalStates = ['SUCCEEDED', 'CANCELLED'];

    return !terminalStates.includes(input.state);
  }

  // ==================================================
  // 🔧 INTERNAL ANOMALY FACTORY
  // ==================================================
  private anomaly(
    input: { paymentId: string; tenantId: string; userId: string },
    type: WorkflowAnomalyType,
    level: ProtectionLevel,
    reason: string,
  ): WorkflowAnomalyEntity {
    this.logger.warn(
      `[PROTECTION] payment anomaly=${reason} payment=${input.paymentId}`,
    );

    return new WorkflowAnomalyEntity(
      `${input.paymentId}:${reason}`,
      input.tenantId,
      input.paymentId,
      type,
      level,
      {
        userId: input.userId,
        reason,
      },
    );
  }
}