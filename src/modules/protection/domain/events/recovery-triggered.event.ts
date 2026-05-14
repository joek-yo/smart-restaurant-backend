// src/modules/protection/domain/events/recovery-triggered.event.ts

import { WorkflowTraceIdVO } from '../value-objects/workflow-trace-id.vo';
import { TenantScopeVO } from '../value-objects/tenant-scope.vo';
import { RecoveryReason } from '../enums/recovery-reason.enum';
import { RecoveryState } from '../enums/recovery-state.enum';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { ProtectionLevel } from '../enums/protection-level.enum';

/**
 * RecoveryTriggeredEvent
 * ----------------------
 * Emitted when the protection engine initiates a recovery process
 * for a workflow that is stale, failed, or inconsistent.
 *
 * This marks:
 * → start of recovery lifecycle
 * → system intervention phase
 * → temporary workflow instability window
 */
export class RecoveryTriggeredEvent {

  constructor(
    // Unique workflow identifier across system
    public readonly traceId: WorkflowTraceIdVO,

    // Tenant isolation context
    public readonly scope: TenantScopeVO,

    // State before recovery begins
    public readonly previousState: WorkflowStatus,

    // Reason recovery was triggered
    public readonly reason: RecoveryReason,

    // Current recovery execution state
    public readonly recoveryState: RecoveryState,

    // Severity of the issue triggering recovery
    public readonly severity: ProtectionLevel,

    // Whether this recovery was automatic or manual
    public readonly autoTriggered: boolean,

    // Number of previous recovery attempts
    public readonly previousAttempts: number,

    // Timestamp when recovery started
    public readonly triggeredAt: Date = new Date(),
  ) {}
}