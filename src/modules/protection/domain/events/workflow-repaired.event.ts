// src/modules/protection/domain/events/workflow-repaired.event.ts

import { WorkflowTraceIdVO } from '../value-objects/workflow-trace-id.vo';
import { TenantScopeVO } from '../value-objects/tenant-scope.vo';
import { WorkflowStatus } from '../enums/workflow-status.enum';
import { WorkflowAnomalyType } from '../enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../enums/protection-level.enum';

/**
 * WorkflowRepairedEvent
 * ----------------------
 * Emitted when the protection engine successfully fixes
 * a corrupted or inconsistent workflow state.
 *
 * Unlike recovery:
 * → Recovery = restore usability
 * → Repair   = fix structural correctness
 */
export class WorkflowRepairedEvent {

  constructor(
    // Global workflow identifier
    public readonly traceId: WorkflowTraceIdVO,

    // Multi-tenant boundary context
    public readonly scope: TenantScopeVO,

    // State before repair
    public readonly previousState: WorkflowStatus,

    // State after repair
    public readonly repairedState: WorkflowStatus,

    // Type of anomaly that triggered repair
    public readonly anomalyType: WorkflowAnomalyType,

    // Severity of the issue repaired
    public readonly severity: ProtectionLevel,

    // Name or identifier of repair strategy used
    public readonly repairStrategy: string,

    // Whether repair required data correction or just state fix
    public readonly dataCorrected: boolean,

    // Execution time of repair process
    public readonly repairDurationMs: number,

    // Timestamp of repair completion
    public readonly repairedAt: Date = new Date(),
  ) {}
}