// FILE: src/modules/protection/application/coordinators/protection-coordinator.service.ts

import { Injectable } from '@nestjs/common';

import { WorkflowStatus } from '../../domain/enums/workflow-status.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';

import { WorkflowConsistencyService } from './workflow-consistency.service';

import { SessionProtectionService } from '../services/session-protection.service';
import { ConversationProtectionService } from '../services/conversation-protection.service';
import { CheckoutProtectionService } from '../services/checkout-protection.service';
import { PaymentProtectionService } from '../services/payment-protection.service';
import { OrderProtectionService } from '../services/order-protection.service';

import { IdempotencyProtectionService } from '../services/idempotency-protection.service';
import { TenantIsolationGuardService } from '../services/tenant-isolation-guard.service';

import { WorkflowTimelineService } from '../services/workflow-timeline.service';

import { DistributedLockCoordinatorService } from './distributed-lock-coordinator.service';

import { WorkflowMetricsService } from '../../infrastructure/observability/workflow-metrics.service';
import { ProtectionLoggerService } from '../../infrastructure/observability/protection-logger.service';
import { WorkflowHealthMonitorService } from '../../infrastructure/observability/workflow-health-monitor.service';

import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

/**
 * ProtectionCoordinatorService
 * ------------------------------------------------------
 * MASTER ORCHESTRATOR FOR THE ENTIRE PROTECTION ENGINE.
 *
 * Responsibilities:
 * - coordinate protection execution
 * - validate workflow integrity
 * - enforce distributed locking
 * - enforce tenant isolation
 * - coordinate idempotency protection
 * - centralize workflow protection lifecycle
 *
 * IMPORTANT:
 * This service owns orchestration ONLY.
 * Business logic remains inside dedicated services.
 */

export interface ProtectionExecutionInput {
  tenantId: string;
  userId: string;

  workflowType:
    | 'conversation'
    | 'session'
    | 'checkout'
    | 'payment'
    | 'order';

  workflowId?: string;

  operation: string;

  state?: string;

  metadata?: Record<string, any>;
}

export interface ProtectionExecutionResult {
  allowed: boolean;

  workflowStatus: WorkflowStatus;

  protectionLevel: ProtectionLevel;

  anomalies: WorkflowAnomalyEntity[];

  lockAcquired: boolean;

  idempotent: boolean;

  traceId: string;

  metadata?: Record<string, any>;
}

@Injectable()
export class ProtectionCoordinatorService {
  constructor(
    // ==================================================
    // CORE COORDINATORS
    // ==================================================

    private readonly consistencyService: WorkflowConsistencyService,
    private readonly lockCoordinator: DistributedLockCoordinatorService,

    // ==================================================
    // DOMAIN PROTECTION SERVICES
    // ==================================================

    private readonly sessionProtection: SessionProtectionService,
    private readonly conversationProtection: ConversationProtectionService,
    private readonly checkoutProtection: CheckoutProtectionService,
    private readonly paymentProtection: PaymentProtectionService,
    private readonly orderProtection: OrderProtectionService,

    // ==================================================
    // SAFETY SERVICES
    // ==================================================

    private readonly idempotencyProtection: IdempotencyProtectionService,
    private readonly tenantIsolationGuard: TenantIsolationGuardService,

    // ==================================================
    // OBSERVABILITY
    // ==================================================

    private readonly timelineService: WorkflowTimelineService,
    private readonly metricsService: WorkflowMetricsService,
    private readonly logger: ProtectionLoggerService,
    private readonly healthMonitor: WorkflowHealthMonitorService,
  ) {}

  // ==================================================
  // 🚦 MAIN PROTECTION ENTRY POINT
  // ==================================================

  async protect(
    input: ProtectionExecutionInput,
  ): Promise<ProtectionExecutionResult> {
    const startedAt = Date.now();

    // ==================================================
    // 🔐 TENANT ISOLATION FIRST
    // ==================================================

    await this.tenantIsolationGuard.validate({
      tenantId: input.tenantId,
      userId: input.userId,
      metadata: input.metadata,
    });

    // ==================================================
    // 🔁 IDEMPOTENCY PROTECTION
    // ==================================================

    const idempotent =
      await this.idempotencyProtection.isDuplicate({
        tenantId: input.tenantId,
        userId: input.userId,
        operation: input.operation,
        workflowType: input.workflowType,
      });

    if (idempotent) {
      this.logger.warn(
        'ProtectionCoordinatorService',
        'DUPLICATE_OPERATION_BLOCKED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
            operation: input.operation,
          },
        },
      );

      return {
        allowed: false,
        workflowStatus: WorkflowStatus.BLOCKED,
        protectionLevel: ProtectionLevel.WARNING,
        anomalies: [],
        lockAcquired: false,
        idempotent: true,
        traceId: this.generateTraceId(input),
      };
    }

    // ==================================================
    // 🔒 DISTRIBUTED LOCKING
    // ==================================================

    const lock =
      await this.lockCoordinator.acquire({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        workflowId: input.workflowId,
      });

    if (!lock.acquired) {
      this.logger.warn(
        'ProtectionCoordinatorService',
        'LOCK_ACQUISITION_FAILED',
        {
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: {
            workflowType: input.workflowType,
          },
        },
      );

      return {
        allowed: false,
        workflowStatus: WorkflowStatus.LOCKED,
        protectionLevel: ProtectionLevel.CRITICAL,
        anomalies: [],
        lockAcquired: false,
        idempotent: false,
        traceId: this.generateTraceId(input),
      };
    }

    try {
      // ==================================================
      // 🧠 DOMAIN-SPECIFIC PROTECTION
      // ==================================================

      await this.executeDomainProtection(input);

      // ==================================================
      // 🔍 CONSISTENCY VALIDATION
      // ==================================================

      const consistency =
        await this.consistencyService.validate({
          tenantId: input.tenantId,
          userId: input.userId,
          metadata: input.metadata,
        });

      // ==================================================
      // 📝 RECORD TIMELINE
      // ==================================================

      await this.timelineService.recordEvent({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        event: 'PROTECTION_EXECUTED',
        state: input.state,
        metadata: {
          operation: input.operation,
          anomalies: consistency.anomalies.length,
        },
      });

      // ==================================================
      // 📊 METRICS
      // ==================================================

      await this.metricsService.recordProtectionExecution({
        workflowType: input.workflowType,
        durationMs: Date.now() - startedAt,
        success: consistency.valid,
      });

      // ==================================================
      // ❤️ HEALTH MONITOR
      // ==================================================

      await this.healthMonitor.reportWorkflowHealth({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowStatus: consistency.workflowStatus,
        anomalies: consistency.anomalies.length,
      });

      // ==================================================
      // 🚦 RESULT
      // ==================================================

      return {
        allowed: consistency.valid,
        workflowStatus: consistency.workflowStatus,
        protectionLevel: this.resolveProtectionLevel(
          consistency.anomalies.length,
        ),
        anomalies: consistency.anomalies,
        lockAcquired: true,
        idempotent: false,
        traceId: this.generateTraceId(input),
      };
    } finally {
      // ==================================================
      // 🔓 ALWAYS RELEASE LOCK
      // ==================================================

      await this.lockCoordinator.release({
        tenantId: input.tenantId,
        userId: input.userId,
        workflowType: input.workflowType,
        workflowId: input.workflowId,
      });
    }
  }

  // ==================================================
  // 🧠 DOMAIN PROTECTION ROUTER
  // ==================================================

  private async executeDomainProtection(
    input: ProtectionExecutionInput,
  ): Promise<void> {
    switch (input.workflowType) {
      case 'conversation':
        await this.conversationProtection.protect(input);
        return;

      case 'session':
        await this.sessionProtection.protect(input);
        return;

      case 'checkout':
        await this.checkoutProtection.protect(input);
        return;

      case 'payment':
        await this.paymentProtection.protect(input);
        return;

      case 'order':
        await this.orderProtection.protect(input);
        return;
    }
  }

  // ==================================================
  // 🚨 PROTECTION LEVEL RESOLUTION
  // ==================================================

  private resolveProtectionLevel(
    anomalyCount: number,
  ): ProtectionLevel {
    if (anomalyCount === 0) {
      return ProtectionLevel.INFO;
    }

    if (anomalyCount <= 2) {
      return ProtectionLevel.WARNING;
    }

    if (anomalyCount <= 5) {
      return ProtectionLevel.CRITICAL;
    }

    return ProtectionLevel.FATAL;
  }

  // ==================================================
  // 🧬 TRACE ID GENERATOR
  // ==================================================

  private generateTraceId(
    input: ProtectionExecutionInput,
  ): string {
    return [
      input.workflowType,
      input.tenantId,
      input.userId,
      Date.now(),
    ].join(':');
  }
}