// src/modules/protection/domain/value-objects/recovery-context.vo.ts

import { RecoveryReason } from '../enums/recovery-reason.enum';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { RecoveryState } from '../enums/recovery-state.enum';
import { WorkflowLockIdVO } from './workflow-lock-id.vo';

/**
 * RecoveryContextVO
 * -----------------
 * Immutable snapshot used to execute and track workflow recovery.
 *
 * This object is passed across:
 * - recovery coordinators
 * - queue workers
 * - retry systems
 * - repair pipelines
 *
 * RULES:
 * - Must be immutable
 * - Must be fully serializable
 * - Must contain enough data to reconstruct state safely
 */
export class RecoveryContextVO {
  constructor(
    public readonly lockId: WorkflowLockIdVO,

    public readonly tenantId: string,
    public readonly userId: string,

    public readonly workflowType: string,

    public readonly previousState: WorkflowStatus,
    public readonly targetState: WorkflowStatus,

    public readonly reason: RecoveryReason,

    public readonly recoveryState: RecoveryState,

    public readonly attempt: number = 1,

    public readonly metadata: Record<string, any> = {},

    public readonly createdAt: Date = new Date(),
  ) {}

  // ─────────────────────────────────────────────
  // 🧠 IMMUTABILITY SAFE UPDATES (returns new instance)
  // ─────────────────────────────────────────────

  withState(state: RecoveryState): RecoveryContextVO {
    return new RecoveryContextVO(
      this.lockId,
      this.tenantId,
      this.userId,
      this.workflowType,
      this.previousState,
      this.targetState,
      this.reason,
      state,
      this.attempt,
      this.metadata,
      this.createdAt,
    );
  }

  incrementAttempt(): RecoveryContextVO {
    return new RecoveryContextVO(
      this.lockId,
      this.tenantId,
      this.userId,
      this.workflowType,
      this.previousState,
      this.targetState,
      this.reason,
      this.recoveryState,
      this.attempt + 1,
      this.metadata,
      this.createdAt,
    );
  }

  addMetadata(extra: Record<string, any>): RecoveryContextVO {
    return new RecoveryContextVO(
      this.lockId,
      this.tenantId,
      this.userId,
      this.workflowType,
      this.previousState,
      this.targetState,
      this.reason,
      this.recoveryState,
      this.attempt,
      {
        ...this.metadata,
        ...extra,
      },
      this.createdAt,
    );
  }

  // ─────────────────────────────────────────────
  // 🧠 SAFE HELPERS
  // ─────────────────────────────────────────────

  isTerminal(): boolean {
    return this.recoveryState === RecoveryState.COMPLETED ||
           this.recoveryState === RecoveryState.FAILED;
  }

  isRetryable(maxRetries: number): boolean {
    return this.attempt < maxRetries;
  }

  toJSON() {
    return {
      lockId: this.lockId.getValue(),
      tenantId: this.tenantId,
      userId: this.userId,
      workflowType: this.workflowType,
      previousState: this.previousState,
      targetState: this.targetState,
      reason: this.reason,
      recoveryState: this.recoveryState,
      attempt: this.attempt,
      metadata: this.metadata,
      createdAt: this.createdAt,
    };
  }
}