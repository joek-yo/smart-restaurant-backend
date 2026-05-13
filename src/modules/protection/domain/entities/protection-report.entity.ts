// src/modules/protection/domain/entities/protection-report.entity.ts

import { WorkflowTraceId } from '../value-objects/workflow-trace-id.vo';
import { TenantScope } from '../value-objects/tenant-scope.vo';
import { ProtectionLevel } from '../enums/protection-level.enum';
import { WorkflowAnomalyType } from '../enums/workflow-anomaly-type.enum';
import { RecoveryReason } from '../enums/recovery-reason.enum';
import { RecoveryState } from '../enums/recovery-state.enum';

/**
 * ProtectionReportEntity
 * ----------------------
 * Final aggregated intelligence layer of the Protection Engine.
 *
 * It answers:
 * - Is the workflow healthy?
 * - Is recovery needed?
 * - Is there risk of failure?
 * - Should we intervene automatically?
 */
export class ProtectionReportEntity {
  constructor(init?: Partial<ProtectionReportEntity>) {
    Object.assign(this, init);
  }

  // ─────────────────────────────────────────────
  // Identity
  // ─────────────────────────────────────────────

  id!: string;

  traceId!: WorkflowTraceId;

  tenantScope!: TenantScope;

  workflowId!: string;

  userId!: string;

  // ─────────────────────────────────────────────
  // Health classification
  // ─────────────────────────────────────────────

  level: ProtectionLevel = ProtectionLevel.INFO;

  healthScore: number = 100; // 0–100 system integrity score

  isHealthy: boolean = true;

  // ─────────────────────────────────────────────
  // Signals summary
  // ─────────────────────────────────────────────

  anomalyCount: number = 0;

  criticalAnomalies: number = 0;

  anomalyTypes: WorkflowAnomalyType[] = [];

  recoveryAttempts: number = 0;

  recoveryState?: RecoveryState;

  recoveryReasons: RecoveryReason[] = [];

  // ─────────────────────────────────────────────
  // Workflow state snapshot
  // ─────────────────────────────────────────────

  currentState?: string;

  expectedState?: string;

  lastTransitionAt?: Date;

  // ─────────────────────────────────────────────
  // Risk analysis
  // ─────────────────────────────────────────────

  riskScore: number = 0; // 0–100

  riskFactors: string[] = [];

  requiresIntervention: boolean = false;

  autoRecoveryTriggered: boolean = false;

  // ─────────────────────────────────────────────
  // Timing
  // ─────────────────────────────────────────────

  generatedAt: Date = new Date();

  evaluatedAt?: Date;

  // ─────────────────────────────────────────────
  // Behavior
  // ─────────────────────────────────────────────

  computeHealth(): void {
    let score = 100;

    // anomaly impact
    score -= this.anomalyCount * 5;
    score -= this.criticalAnomalies * 20;

    // recovery instability penalty
    score -= this.recoveryAttempts * 10;

    // risk penalty
    score -= this.riskScore * 0.5;

    this.healthScore = Math.max(0, Math.min(100, score));

    this.isHealthy = this.healthScore > 70;

    this.level =
      this.healthScore >= 85
        ? ProtectionLevel.INFO
        : this.healthScore >= 60
        ? ProtectionLevel.WARNING
        : this.healthScore >= 30
        ? ProtectionLevel.CRITICAL
        : ProtectionLevel.FATAL;
  }

  evaluateIntervention(): void {
    this.requiresIntervention =
      this.criticalAnomalies > 0 ||
      this.healthScore < 60 ||
      this.recoveryAttempts >= 3 ||
      this.riskScore > 70;
  }

  markAutoRecoveryTriggered(): void {
    this.autoRecoveryTriggered = true;
    this.recoveryAttempts += 1;
  }

  addRiskFactor(factor: string): void {
    if (!this.riskFactors.includes(factor)) {
      this.riskFactors.push(factor);
    }
  }
}