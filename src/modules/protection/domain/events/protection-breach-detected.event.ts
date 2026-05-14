// FILE: src/modules/protection/domain/events/protection-breach-detected.event.ts

import { TenantScopeVO } from '../value-objects/tenant-scope.vo';
import { WorkflowTraceIdVO } from '../value-objects/workflow-trace-id.vo';
import { ProtectionLevel } from '../enums/protection-level.enum';

/**
 * PROTECTION BREACH EVENT
 * -----------------------
 * Fired when system detects isolation/security violation.
 */
export class ProtectionBreachDetectedEvent {
  constructor(
    public readonly tenant: TenantScopeVO,
    public readonly traceId: WorkflowTraceIdVO,
    public readonly level: ProtectionLevel,
    public readonly violation: string,
    public readonly detectedAt: Date = new Date(),
  ) {}
}