// src/modules/protection/domain/repositories/workflow-timeline.repository.ts

import { WorkflowTimelineEntity } from '../entities/workflow-timeline.entity';
import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { RecoveryReason } from '../enums/recovery-reason.enum';

/**
 * WorkflowTimelineRepository
 * --------------------------
 * Abstract contract for persistent workflow event storage.
 *
 * This is the system's:
 * 🧠 "black box recorder interface"
 *
 * Every workflow mutation, anomaly, recovery, and transition
 * MUST be recorded through this contract.
 *
 * It enables:
 * - replay debugging
 * - forensic analysis
 * - recovery reasoning
 * - system observability
 */
export abstract class WorkflowTimelineRepository {

  /**
   * Get full timeline for a workflow
   */
  abstract getTimeline(
    workflowId: string,
    tenantScope: TenantScope,
  ): Promise<WorkflowTimelineEntity | null>;

  /**
   * Create a new timeline if it doesn't exist
   */
  abstract create(
    timeline: WorkflowTimelineEntity,
  ): Promise<WorkflowTimelineEntity>;

  /**
   * Append a single event to an existing workflow timeline
   *
   * MUST be atomic and append-only.
   */
  abstract appendEvent(
    workflowId: string,
    tenantScope: TenantScope,
    event: {
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

      from?: WorkflowStatus;
      to?: WorkflowStatus;

      reason?: RecoveryReason;

      error?: string;

      metadata?: Record<string, any>;
    },
  ): Promise<void>;

  /**
   * Bulk append (used during recovery / replay / repair)
   */
  abstract appendMany(
    workflowId: string,
    tenantScope: TenantScope,
    events: Array<Parameters<WorkflowTimelineRepository['appendEvent']>[2]>,
  ): Promise<void>;

  /**
   * Get recent events for fast diagnostics (limited window)
   */
  abstract getRecentEvents(
    workflowId: string,
    tenantScope: TenantScope,
    limit: number,
  ): Promise<
    Array<{
      type: string;
      timestamp: Date;
      metadata?: Record<string, any>;
    }>
  >;

  /**
   * Delete timeline (rare; only for GDPR / compliance resets)
   */
  abstract deleteTimeline(
    workflowId: string,
    tenantScope: TenantScope,
  ): Promise<void>;
}