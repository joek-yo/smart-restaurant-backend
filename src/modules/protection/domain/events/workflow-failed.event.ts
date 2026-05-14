// src/modules/protection/domain/events/workflow-failed.event.ts

import { WorkflowTraceIdVO } from '../value-objects/workflow-trace-id.vo';
import { RecoveryReason } from '../enums/recovery-reason.enum';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { WorkflowAnomalyType } from '../enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../enums/protection-level.enum';
import { TenantScopeVO } from '../value-objects/tenant-scope.vo';

/**
 * WorkflowFailedEvent
 * --------------------
 * Emitted when a workflow recovery or repair attempt fails completely.
 *
 * This represents:
 * → recovery exhaustion
 * → system inconsistency not resolvable automatically
 * → potential data corruption or missing invariants
 */
export class WorkflowFailedEvent {

  constructor(
    // Unique workflow identifier across system boundaries
    public readonly traceId: WorkflowTraceIdVO,

    // Tenant isolation context
    public readonly scope: TenantScopeVO,

    // State before failure
    public readonly previousState: WorkflowStatus,

    // Final failed state
    public readonly failedState: WorkflowStatus,

    // Why recovery/repair failed
    public readonly reason: RecoveryReason,

    // Category of anomaly detected
    public readonly anomalyType: WorkflowAnomalyType,

    // Severity of this failure
    public readonly severity: ProtectionLevel,

    // Number of recovery attempts before failure
    public readonly attempts: number,

    // Optional technical error details
    public readonly error?: string,

    // When failure was finalized
    public readonly failedAt: Date = new Date(),
  ) {}
}