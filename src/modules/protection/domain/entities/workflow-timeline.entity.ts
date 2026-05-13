// src/modules/protection/domain/entities/workflow-timeline.entity.ts

import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { RecoveryReason } from '../enums/recovery-reason.enum';

/**
 * WorkflowTimelineEntity
 * ----------------------
 * Durable append-only history of ALL workflow events.
 *
 * This is the "black box recorder" of the system.
 *
 * It tracks:
 * - state transitions
 * - recovery attempts
 * - failures
 * - anomalies
 * - external side effects
 */
export class WorkflowTimelineEntity {
  constructor(init?: Partial<WorkflowTimelineEntity>) {
    Object.assign(this, init);
  }

  // ─────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────

  id!: string;

  traceId!: WorkflowTraceId;

  tenantScope!: TenantScope;

  workflowId!: string; // sessionId / checkoutId / orderId / conversationId

  // ─────────────────────────────────────────────
  // Timeline data
  // ─────────────────────────────────────────────

  events: WorkflowTimelineEvent[] = [];

  createdAt: Date = new Date();

  updatedAt: Date = new Date();

  // ─────────────────────────────────────────────
  // Core behavior
  // ─────────────────────────────────────────────

  append(event: WorkflowTimelineEvent): void {
    this.events.push({
      ...event,
      timestamp: event.timestamp ?? new Date(),
    });

    this.updatedAt = new Date();
  }

  markRecovery(reason: RecoveryReason): void {
    this.append({
      type: 'RECOVERY_TRIGGERED',
      reason,
      timestamp: new Date(),
    });
  }

  markTransition(from: WorkflowStatus, to: WorkflowStatus): void {
    this.append({
      type: 'STATE_TRANSITION',
      from,
      to,
      timestamp: new Date(),
    });
  }

  markFailure(error: string): void {
    this.append({
      type: 'WORKFLOW_FAILED',
      error,
      timestamp: new Date(),
    });
  }
}

/**
 * Single timeline event (append-only log entry)
 */
export interface WorkflowTimelineEvent {
  type:
    | 'STATE_TRANSITION'
    | 'RECOVERY_TRIGGERED'
    | 'ANOMALY_DETECTED'
    | 'WORKFLOW_FAILED'
    | 'LOCK_ACQUIRED'
    | 'LOCK_RELEASED'
    | 'TIMEOUT'
    | 'REPAIR_APPLIED';

  timestamp?: Date;

  // state transitions
  from?: WorkflowStatus;
  to?: WorkflowStatus;

  // recovery info
  reason?: RecoveryReason;

  // error tracking
  error?: string;

  // optional metadata for debugging/analytics
  metadata?: Record<string, any>;
}