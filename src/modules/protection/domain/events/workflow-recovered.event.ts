// src/modules/protection/domain/events/workflow-recovered.event.ts

import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { RecoveryReason } from '../enums/recovery-reason.enum';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { TenantScope } from '../value-objects/tenant-scope.vo';

/**
 * WorkflowRecoveredEvent
 * -----------------------
 * Emitted when a failed / abandoned / inconsistent workflow
 * has been successfully restored to a valid state.
 *
 * This event signals:
 * → recovery success
 * → system stability restored
 * → workflow can safely resume
 */
export class WorkflowRecoveredEvent {

  constructor(
    // Unique workflow identifier across all systems
    public readonly traceId: WorkflowTraceId,

    // Multi-tenant isolation context
    public readonly scope: TenantScope,

    // Previous broken state (before recovery)
    public readonly previousState: WorkflowStatus,

    // New restored safe state
    public readonly restoredState: WorkflowStatus,

    // Why recovery was triggered
    public readonly reason: RecoveryReason,

    // Recovery execution duration (ms)
    public readonly recoveryDurationMs: number,

    // Timestamp of successful recovery
    public readonly recoveredAt: Date = new Date(),
  ) {}
}