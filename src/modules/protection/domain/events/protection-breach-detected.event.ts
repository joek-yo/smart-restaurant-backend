// FILE: src/modules/protection/domain/events/protection-breach-detected.event.ts

import { TenantScope } from '../value-objects/tenant-scope.vo';
import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { ProtectionLevel } from '../enums/protection-level.enum';

/**
 * PROTECTION BREACH EVENT
 * -----------------------
 * Fired when system detects isolation/security violation.
 */
export class ProtectionBreachDetectedEvent {
  constructor(
    public readonly tenant: TenantScope,
    public readonly traceId: WorkflowTraceId,
    public readonly level: ProtectionLevel,
    public readonly violation: string,
    public readonly detectedAt: Date = new Date(),
  ) {}
}