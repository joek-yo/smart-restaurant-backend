// src/modules/protection/domain/events/workflow-timeout.event.ts

import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { RecoveryReason } from '../enums/recovery-reason.enum';
import { ProtectionLevel } from '../enums/protection-level.enum';

/**
 * WorkflowTimeoutEvent
 * ---------------------
 * Emitted when a workflow exceeds its allowed execution time window.
 *
 * This represents:
 * → execution stall
 * → system overload or deadlock risk
 * → need for forced intervention
 */
export class WorkflowTimeoutEvent {

  constructor(
    // Unique workflow identifier
    public readonly traceId: WorkflowTraceId,

    // Tenant isolation context
    public readonly scope: TenantScope,

    // Workflow state at timeout moment
    public readonly currentState: WorkflowStatus,

    // Maximum allowed execution duration (ms)
    public readonly allowedDurationMs: number,

    // Actual execution duration (ms)
    public readonly actualDurationMs: number,

    // Reason context (optional linkage to recovery system)
    public readonly reason: RecoveryReason,

    // Severity of timeout impact
    public readonly severity: ProtectionLevel,

    // Whether workflow is eligible for auto-recovery
    public readonly recoverable: boolean,

    // Timestamp when timeout was detected
    public readonly timedOutAt: Date = new Date(),
  ) {}
}