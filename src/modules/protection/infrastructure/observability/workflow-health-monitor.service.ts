// FILE: src/modules/protection/infrastructure/observability/workflow-health-monitor.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { WorkflowMetricsService } from './workflow-metrics.service';
import { AnomalyDetectorService } from './anomaly-detector.service';

/**
 * WorkflowHealthMonitorService
 * ----------------------------
 * Central health brain of the Protection Engine.
 *
 * Responsibilities:
 * - Continuously assess workflow/system health
 * - Combine metrics + anomalies into a health score
 * - Detect systemic degradation early
 * - Trigger alerts / recovery signals (future integration)
 */

export interface WorkflowHealthStatus {
  tenantId: string;

  healthScore: number; // 0 → 1

  state:
    | 'HEALTHY'
    | 'DEGRADED'
    | 'UNSTABLE'
    | 'CRITICAL'
    | 'FAILED';

  metrics: {
    successRate: number;
    failureRate: number;
    timeoutRate: number;
    anomalyRate: number;
    lockContentionRate: number;
  };

  anomalyCount: number;

  lastEvaluatedAt: number;
}

@Injectable()
export class WorkflowHealthMonitorService {
  private readonly logger = new Logger(WorkflowHealthMonitorService.name);

  constructor(
    private readonly metrics: WorkflowMetricsService,
    private readonly anomalies: AnomalyDetectorService,
  ) {}

  // ─────────────────────────────────────────────
  // MAIN HEALTH EVALUATION
  // ─────────────────────────────────────────────
  evaluate(tenantId: string): WorkflowHealthStatus {
    const snapshot = this.metrics.snapshot(tenantId);
    const anomalyList = this.anomalies.byTenant(tenantId);

    const anomalyCount = anomalyList.length;

    // ─────────────────────────────────────────────
    // HEALTH SCORE CALCULATION (0 → 1)
    // ─────────────────────────────────────────────
    const successWeight = snapshot.successRate * 0.5;
    const failurePenalty = snapshot.failureRate * 0.3;
    const timeoutPenalty = snapshot.timeoutRate * 0.1;
    const anomalyPenalty = Math.min(anomalyCount / 20, 0.2);
    const lockPenalty = snapshot.lockContentionRate * 0.1;

    let score =
      successWeight -
      failurePenalty -
      timeoutPenalty -
      anomalyPenalty -
      lockPenalty;

    // clamp
    if (score < 0) score = 0;
    if (score > 1) score = 1;

    // ─────────────────────────────────────────────
    // STATE CLASSIFICATION
    // ─────────────────────────────────────────────
    let state: WorkflowHealthStatus['state'];

    if (score >= 0.85) state = 'HEALTHY';
    else if (score >= 0.7) state = 'DEGRADED';
    else if (score >= 0.5) state = 'UNSTABLE';
    else if (score >= 0.25) state = 'CRITICAL';
    else state = 'FAILED';

    const result: WorkflowHealthStatus = {
      tenantId,
      healthScore: score,

      state,

      metrics: {
        successRate: snapshot.successRate,
        failureRate: snapshot.failureRate,
        timeoutRate: snapshot.timeoutRate,
        anomalyRate: snapshot.anomalyRate,
        lockContentionRate: snapshot.lockContentionRate,
      },

      anomalyCount,

      lastEvaluatedAt: Date.now(),
    };

    this.logger.debug(
      `[HEALTH] tenant=${tenantId} score=${score.toFixed(2)} state=${state}`,
    );

    return result;
  }

  // ─────────────────────────────────────────────
  // GLOBAL HEALTH SNAPSHOT
  // ─────────────────────────────────────────────
  evaluateGlobal(): WorkflowHealthStatus {
    const snapshot = this.metrics.globalSummary();

    const anomalyCount = this.anomalies.recent(1000).length;

    const score =
      snapshot.successRate * 0.5 -
      snapshot.failureRate * 0.3 -
      snapshot.timeoutRate * 0.1 -
      Math.min(anomalyCount / 50, 0.2) -
      snapshot.lockContentionRate * 0.1;

    const clamped = Math.max(0, Math.min(1, score));

    let state: WorkflowHealthStatus['state'];

    if (clamped >= 0.85) state = 'HEALTHY';
    else if (clamped >= 0.7) state = 'DEGRADED';
    else if (clamped >= 0.5) state = 'UNSTABLE';
    else if (clamped >= 0.25) state = 'CRITICAL';
    else state = 'FAILED';

    return {
      tenantId: 'GLOBAL',
      healthScore: clamped,
      state,
      metrics: {
        successRate: snapshot.successRate,
        failureRate: snapshot.failureRate,
        timeoutRate: snapshot.timeoutRate,
        anomalyRate: snapshot.anomalyRate,
        lockContentionRate: snapshot.lockContentionRate,
      },
      anomalyCount,
      lastEvaluatedAt: Date.now(),
    };
  }
}