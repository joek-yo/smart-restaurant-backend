// src/modules/protection/domain/entities/workflow-anomaly.entity.ts

import { WorkflowTraceIdVO } from '../value-objects/workflow-trace-id.vo';
import { TenantScopeVO } from '../value-objects/tenant-scope.vo';
import { WorkflowAnomalyType } from '../enums/workflow-anomaly-type.enum';
import { ProtectionLevel } from '../enums/protection-level.enum';
import { WorkflowStatus } from '../enums/workflow-status.enum';

/**
 * WorkflowAnomalyEntity
 * ----------------------
 * Represents a detected inconsistency, corruption, or unexpected state
 * in any workflow (conversation, checkout, payment, session, order).
 *
 * This is NOT an error log.
 * This is a STRUCTURAL INTEGRITY VIOLATION record.
 */
export class WorkflowAnomalyEntity {
  tenantId?: string;

  constructor(init?: Partial<WorkflowAnomalyEntity>) {
    Object.assign(this, init);
  }

  // ─────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────

  id!: string;

  traceId!: WorkflowTraceIdVO;

  tenantScope!: TenantScopeVO;

  workflowId!: string;

  userId!: string;

  // ─────────────────────────────────────────────
  // Anomaly classification
  // ─────────────────────────────────────────────

  type!: WorkflowAnomalyType;

  severity: ProtectionLevel = ProtectionLevel.WARNING;

  // ─────────────────────────────────────────────
  // State context at detection time
  // ─────────────────────────────────────────────

  detectedState!: WorkflowStatus;

  expectedState?: WorkflowStatus;

  // ─────────────────────────────────────────────
  // Diagnostic information
  // ─────────────────────────────────────────────

  message!: string;

  stackTrace?: string;

  reason?: string;

  metadata?: Record<string, any>;

  // ─────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────

  detectedAt: Date = new Date();

  resolvedAt?: Date;

  resolved: boolean = false;

  // ─────────────────────────────────────────────
  // Behavior
  // ─────────────────────────────────────────────

  markResolved(): void {
    this.resolved = true;
    this.resolvedAt = new Date();
  }

  escalate(): void {
    // escalation is conceptual here (handled by services)
    this.severity =
      this.severity === ProtectionLevel.INFO
        ? ProtectionLevel.WARNING
        : this.severity === ProtectionLevel.WARNING
        ? ProtectionLevel.CRITICAL
        : ProtectionLevel.FATAL;
  }

  isCritical(): boolean {
    return (
      this.severity === ProtectionLevel.CRITICAL ||
      this.severity === ProtectionLevel.FATAL
    );
  }

  isUnresolved(): boolean {
    return !this.resolved;
  }
}