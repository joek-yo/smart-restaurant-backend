// src/modules/protection/domain/entities/recovery-session.entity.ts

import { RecoveryReason } from '../enums/recovery-reason.enum';
import { RecoveryState } from '../enums/recovery-state.enum';
import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';

/**
 * RecoverySessionEntity
 * ----------------------
 * Represents ONE execution attempt of recovery for a workflow.
 *
 * Think of it as:
 * "a single recovery run, not the whole recovery history"
 *
 * Multiple of these can exist per workflow over time.
 */
export class RecoverySessionEntity {
  constructor(init?: Partial<RecoverySessionEntity>) {
    Object.assign(this, init);
  }

  // ─────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────

  id!: string;

  traceId!: WorkflowTraceId;

  tenantScope!: TenantScope;

  workflowId!: string;

  userId!: string;

  // ─────────────────────────────────────────────
  // Execution state
  // ─────────────────────────────────────────────

  state: RecoveryState = RecoveryState.PENDING;

  reason!: RecoveryReason;

  attempt: number = 1;

  maxAttempts: number = 3;

  // ─────────────────────────────────────────────
  // Timing
  // ─────────────────────────────────────────────

  startedAt?: Date;

  completedAt?: Date;

  lastUpdatedAt: Date = new Date();

  // ─────────────────────────────────────────────
  // Outcome tracking
  // ─────────────────────────────────────────────

  success?: boolean;

  error?: string;

  result?: {
    restoredState?: string;
    actionsPerformed?: string[];
    sideEffects?: string[];
  };

  // ─────────────────────────────────────────────
  // Behavior
  // ─────────────────────────────────────────────

  start(): void {
    if (this.state !== RecoveryState.PENDING) {
      throw new Error(`Cannot start recovery from state ${this.state}`);
    }

    this.state = RecoveryState.RUNNING;
    this.startedAt = new Date();
    this.lastUpdatedAt = new Date();
  }

  markSuccess(result?: RecoverySessionEntity['result']): void {
    this.state = RecoveryState.COMPLETED;
    this.success = true;
    this.result = result;
    this.completedAt = new Date();
    this.lastUpdatedAt = new Date();
  }

  markFailure(error: string): void {
    this.state = RecoveryState.FAILED;
    this.success = false;
    this.error = error;
    this.completedAt = new Date();
    this.lastUpdatedAt = new Date();
  }

  canRetry(): boolean {
    return (
      this.state === RecoveryState.FAILED &&
      this.attempt < this.maxAttempts
    );
  }

  incrementAttempt(): void {
    this.attempt += 1;
    this.state = RecoveryState.PENDING;
    this.lastUpdatedAt = new Date();
  }
}