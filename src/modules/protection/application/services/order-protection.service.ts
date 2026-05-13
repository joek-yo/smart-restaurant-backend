// FILE: src/modules/protection/application/services/order-protection.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';
import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

/**
 * OrderProtectionService
 * ----------------------
 * Ensures order lifecycle integrity across:
 * - creation
 * - processing
 * - completion
 * - cancellation
 *
 * This service enforces safety rules ONLY.
 * It does NOT mutate orders or trigger side effects.
 */
@Injectable()
export class OrderProtectionService {
  private readonly logger = new Logger(OrderProtectionService.name);

  // ==================================================
  // 🔒 VALIDATE ORDER READINESS
  // ==================================================
  validateOrderReadiness(input: {
    orderId: string;
    tenantId: string;
    userId: string;
    itemsCount: number;
    totalAmount: number;
    status: string;
    sessionId?: string;
  }): WorkflowAnomalyEntity | null {
    if (!input.sessionId) {
      return this.anomaly(
        input,
        WorkflowAnomalyType.STATE_CORRUPTION,
        ProtectionLevel.CRITICAL,
        'MISSING_SESSION_ID',
      );
    }

    if (input.itemsCount <= 0) {
      return this.anomaly(
        input,
        WorkflowAnomalyType.STATE_CORRUPTION,
        ProtectionLevel.FATAL,
        'EMPTY_ORDER_ITEMS',
      );
    }

    if (input.totalAmount <= 0) {
      return this.anomaly(
        input,
        WorkflowAnomalyType.STATE_CORRUPTION,
        ProtectionLevel.FATAL,
        'INVALID_TOTAL_AMOUNT',
      );
    }

    return null;
  }

  // ==================================================
  // 🔁 VALIDATE ORDER STATE TRANSITIONS
  // ==================================================
  validateTransition(input: {
    orderId: string;
    tenantId: string;
    userId: string;
    from: string;
    to: string;
  }): WorkflowAnomalyEntity | null {
    const allowed: Record<string, string[]> = {
      PENDING: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowedNext = allowed[input.from] ?? [];

    if (!allowedNext.includes(input.to)) {
      this.logger.error(
        `[PROTECTION] invalid order transition ${input.from} → ${input.to}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.orderId}:INVALID_ORDER_TRANSITION`,
        input.tenantId,
        input.orderId,
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
  // 🚨 DETECT DUPLICATE ORDER CREATION
  // ==================================================
  detectDuplicateOrder(input: {
    orderId: string;
    sessionId: string;
    tenantId: string;
    userId: string;
    alreadyExists: boolean;
  }): WorkflowAnomalyEntity | null {
    if (input.alreadyExists) {
      this.logger.warn(
        `[PROTECTION] duplicate order detected order=${input.orderId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.orderId}:DUPLICATE_ORDER`,
        input.tenantId,
        input.orderId,
        WorkflowAnomalyType.DUPLICATE_MESSAGE,
        ProtectionLevel.FATAL,
        {
          sessionId: input.sessionId,
          userId: input.userId,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🧠 CHECK IF ORDER IS RECOVERABLE
  // ==================================================
  isRecoverable(input: {
    status: string;
  }): boolean {
    const terminal = ['COMPLETED', 'CANCELLED'];

    return !terminal.includes(input.status);
  }

  // ==================================================
  // 🔧 INTERNAL ANOMALY FACTORY
  // ==================================================
  private anomaly(
    input: { orderId: string; tenantId: string; userId: string },
    type: WorkflowAnomalyType,
    level: ProtectionLevel,
    reason: string,
  ): WorkflowAnomalyEntity {
    this.logger.warn(
      `[PROTECTION] order anomaly=${reason} order=${input.orderId}`,
    );

    return new WorkflowAnomalyEntity(
      `${input.orderId}:${reason}`,
      input.tenantId,
      input.orderId,
      type,
      level,
      {
        userId: input.userId,
        reason,
      },
    );
  }
}