// src/modules/protection/domain/events/stale-workflow-detected.event.ts

import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { ProtectionLevel } from '../enums/protection-level.enum';

/**
 * StaleWorkflowDetectedEvent
 * --------------------------
 * Emitted when a workflow shows signs of inactivity,
 * stalling, or abnormal delay in progression.
 *
 * This is an early warning signal BEFORE:
 * → abandonment
 * → timeout failure
 * → recovery trigger
 */
export class StaleWorkflowDetectedEvent {

  constructor(
    // Unique workflow identifier
    public readonly traceId: WorkflowTraceId,

    // Multi-tenant boundary context
    public readonly scope: TenantScope,

    // Current workflow state when detected
    public readonly currentState: WorkflowStatus,

    // How long workflow has been inactive (ms)
    public readonly idleDurationMs: number,

    // Expected max allowed inactivity threshold (ms)
    public readonly thresholdMs: number,

    // Severity of staleness detection
    public readonly severity: ProtectionLevel,

    // Whether workflow is considered at risk of abandonment
    public readonly atRiskOfAbandonment: boolean,

    // Last known active timestamp
    public readonly lastActivityAt: Date,

    // Detection timestamp
    public readonly detectedAt: Date = new Date(),
  ) {}
}