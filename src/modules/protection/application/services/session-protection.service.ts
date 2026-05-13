// FILE: src/modules/protection/application/services/session-protection.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { TenantScopeVO } from '../../domain/value-objects/tenant-scope.vo';
import { WorkflowAnomalyType } from '../../domain/enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../../domain/enums/protection-level.enum';
import { WorkflowAnomalyEntity } from '../../domain/entities/workflow-anomaly.entity';

/**
 * SessionProtectionService
 * ------------------------
 * Enforces session integrity rules across:
 * - cart/session consistency
 * - tenant isolation
 * - session lifecycle validity
 * - stale session detection hooks
 *
 * This service DOES NOT mutate sessions directly.
 * It only validates + flags anomalies for recovery pipelines.
 */
@Injectable()
export class SessionProtectionService {
  private readonly logger = new Logger(SessionProtectionService.name);

  // ==================================================
  // 🔒 TENANT ISOLATION GUARD
  // ==================================================
  validateTenantIsolation(input: {
    sessionTenantId: string;
    requestTenantId: string;
    sessionId: string;
    userId: string;
  }): WorkflowAnomalyEntity | null {
    const sessionScope = new TenantScopeVO(input.sessionTenantId);
    const requestScope = new TenantScopeVO(input.requestTenantId);

    if (!sessionScope.equals(requestScope)) {
      this.logger.error(
        `[PROTECTION] tenant violation session=${input.sessionId} user=${input.userId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.sessionId}:TENANT_BREACH`,
        input.requestTenantId,
        input.sessionId,
        WorkflowAnomalyType.CROSS_TENANT_ACCESS,
        ProtectionLevel.FATAL,
        {
          sessionTenantId: input.sessionTenantId,
          requestTenantId: input.requestTenantId,
          userId: input.userId,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🧠 SESSION CONSISTENCY VALIDATION
  // ==================================================
  validateSessionConsistency(input: {
    sessionId: string;
    itemsCount: number;
    state: string;
  }): WorkflowAnomalyEntity | null {
    // Empty cart in active session = inconsistency signal
    if (input.state === 'CHECKOUT' && input.itemsCount === 0) {
      this.logger.warn(
        `[PROTECTION] inconsistent session state=${input.state} session=${input.sessionId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.sessionId}:EMPTY_CHECKOUT`,
        'SYSTEM',
        input.sessionId,
        WorkflowAnomalyType.STATE_CORRUPTION,
        ProtectionLevel.CRITICAL,
        {
          state: input.state,
          itemsCount: input.itemsCount,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🔁 STALE SESSION DETECTION
  // ==================================================
  detectStaleSession(input: {
    sessionId: string;
    lastUpdatedAt: Date;
    thresholdMs: number;
  }): WorkflowAnomalyEntity | null {
    const now = Date.now();
    const last = input.lastUpdatedAt.getTime();

    if (now - last > input.thresholdMs) {
      this.logger.warn(
        `[PROTECTION] stale session detected session=${input.sessionId}`,
      );

      return new WorkflowAnomalyEntity(
        `${input.sessionId}:STALE`,
        'SYSTEM',
        input.sessionId,
        WorkflowAnomalyType.STALE_WORKFLOW,
        ProtectionLevel.WARNING,
        {
          lastUpdatedAt: input.lastUpdatedAt,
          thresholdMs: input.thresholdMs,
        },
      );
    }

    return null;
  }

  // ==================================================
  // 🧠 SESSION RECOVERY READINESS CHECK
  // ==================================================
  isRecoverable(input: {
    state: string;
    itemsCount: number;
  }): boolean {
    const nonRecoverableStates = ['ORDER_CONFIRMED', 'CANCELLED'];

    if (nonRecoverableStates.includes(input.state)) {
      return false;
    }

    // empty session is not worth recovering
    if (input.itemsCount === 0) {
      return false;
    }

    return true;
  }
}