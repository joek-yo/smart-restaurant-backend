// FILE: src/modules/protection/infrastructure/observability/workflow-metrics.service.ts

import { Injectable, Logger } from '@nestjs/common';

/**
 * WorkflowMetricsService
 * ----------------------
 * Aggregates system-wide workflow reliability signals:
 * - recovery success rate
 * - failure rate
 * - timeout frequency
 * - anomaly counts
 * - lock contention signals
 *
 * This is NOT storage.
 * This is REAL-TIME aggregation for observability + health scoring.
 */

export interface WorkflowMetricEvent {
  tenantId: string;
  workflow: string;

  type:
    | 'RECOVERY_SUCCESS'
    | 'RECOVERY_FAILED'
    | 'WORKFLOW_TIMEOUT'
    | 'DUPLICATE_MESSAGE'
    | 'LOCK_CONTENTION'
    | 'ANOMALY_DETECTED'
    | 'REPAIR_SUCCESS'
    | 'REPAIR_FAILED';

  timestamp: number;
}

export interface WorkflowMetricSnapshot {
  tenantId: string;

  totals: Record<string, number>;

  successRate: number;
  failureRate: number;
  timeoutRate: number;

  lockContentionRate: number;
  anomalyRate: number;

  lastUpdated: number;
}

/**
 * In-memory aggregator (swap with Prometheus/Datadog later)
 */
@Injectable()
export class WorkflowMetricsService {
  private readonly logger = new Logger(WorkflowMetricsService.name);

  private readonly events: WorkflowMetricEvent[] = [];
  private readonly MAX = 5000;

  // ─────────────────────────────────────────────
  // RECORD EVENT
  // ─────────────────────────────────────────────
  record(event: WorkflowMetricEvent): void {
    if (this.events.length >= this.MAX) {
      this.events.shift();
    }

    this.events.push(event);
  }

  // ─────────────────────────────────────────────
  // SNAPSHOT BY TENANT
  // ─────────────────────────────────────────────
  snapshot(tenantId: string): WorkflowMetricSnapshot {
    const filtered = this.events.filter(e => e.tenantId === tenantId);

    const totals: Record<string, number> = {};

    for (const e of filtered) {
      totals[e.type] = (totals[e.type] ?? 0) + 1;
    }

    const success = totals.RECOVERY_SUCCESS ?? 0;
    const failed =
      (totals.RECOVERY_FAILED ?? 0) +
      (totals.REPAIR_FAILED ?? 0);

    const timeouts = totals.WORKFLOW_TIMEOUT ?? 0;
    const lockContention = totals.LOCK_CONTENTION ?? 0;
    const anomalies = totals.ANOMALY_DETECTED ?? 0;

    const total = filtered.length || 1;

    const snapshot: WorkflowMetricSnapshot = {
      tenantId,
      totals,

      successRate: success / total,
      failureRate: failed / total,
      timeoutRate: timeouts / total,

      lockContentionRate: lockContention / total,
      anomalyRate: anomalies / total,

      lastUpdated: Date.now(),
    };

    this.logger.debug(
      `[METRICS] tenant=${tenantId} success=${snapshot.successRate.toFixed(2)} failure=${snapshot.failureRate.toFixed(2)}`,
    );

    return snapshot;
  }

  // ─────────────────────────────────────────────
  // GLOBAL HEALTH SUMMARY
  // ─────────────────────────────────────────────
  globalSummary(): WorkflowMetricSnapshot {
    const totals: Record<string, number> = {};

    for (const e of this.events) {
      totals[e.type] = (totals[e.type] ?? 0) + 1;
    }

    const total = this.events.length || 1;

    return {
      tenantId: 'GLOBAL',
      totals,

      successRate:
        (totals.RECOVERY_SUCCESS ?? 0) / total,

      failureRate:
        ((totals.RECOVERY_FAILED ?? 0) +
          (totals.REPAIR_FAILED ?? 0)) / total,

      timeoutRate:
        (totals.WORKFLOW_TIMEOUT ?? 0) / total,

      lockContentionRate:
        (totals.LOCK_CONTENTION ?? 0) / total,

      anomalyRate:
        (totals.ANOMALY_DETECTED ?? 0) / total,

      lastUpdated: Date.now(),
    };
  }

  // ─────────────────────────────────────────────
  // DEBUG HELPERS
  // ─────────────────────────────────────────────
  recent(limit = 50): WorkflowMetricEvent[] {
    return this.events.slice(-limit);
  }

  clear(): void {
    this.events.length = 0;
  }

  async recordProtectionExecution(_input?: any): Promise<void> {}

  async recordRecoveryExecution(_input?: any): Promise<void> {}

  async recordWorkflowAbandonment(_input?: any): Promise<void> {}

  async recordStaleWorkflow(_input?: any): Promise<void> {}

  async recordWorkflowRepair(_input?: any): Promise<void> {}
}
