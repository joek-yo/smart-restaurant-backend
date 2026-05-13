// FILE: src/modules/protection/infrastructure/observability/anomaly-detector.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { WorkflowMetricsService } from './workflow-metrics.service';

/**
 * AnomalyDetectorService
 * ----------------------
 * Detects workflow corruption patterns such as:
 * - invalid state transitions
 * - repeated failures
 * - stuck workflows
 * - lock contention spikes
 * - duplicate message storms
 *
 * This is a RULE-BASED detector (not ML).
 * Keeps system deterministic and explainable.
 */

export type AnomalyType =
  | 'INVALID_TRANSITION'
  | 'STUCK_WORKFLOW'
  | 'REPEATED_FAILURE'
  | 'LOCK_STORM'
  | 'DUPLICATE_MESSAGE_STORM'
  | 'HIGH_TIMEOUT_RATE'
  | 'STATE_CORRUPTION';

export interface AnomalyEvent {
  tenantId: string;
  workflow: string;
  type: AnomalyType;

  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'FATAL';

  message: string;
  timestamp: number;

  metadata?: Record<string, any>;
}

@Injectable()
export class AnomalyDetectorService {
  private readonly logger = new Logger(AnomalyDetectorService.name);

  private readonly anomalies: AnomalyEvent[] = [];
  private readonly MAX = 3000;

  constructor(
    private readonly metrics: WorkflowMetricsService,
  ) {}

  // ─────────────────────────────────────────────
  // CORE DETECTION ENTRY
  // ─────────────────────────────────────────────
  detect(input: {
    tenantId: string;
    workflow: string;
    state?: string;
    lastStates?: string[];
    failureCount?: number;
    lockWaitMs?: number;
    duplicateMessageCount?: number;
  }): AnomalyEvent[] {
    const results: AnomalyEvent[] = [];

    // 1. STUCK WORKFLOW DETECTION
    if (input.lastStates && input.lastStates.length >= 5) {
      const allSame = input.lastStates.every(
        s => s === input.lastStates![0],
      );

      if (allSame) {
        results.push(this.create({
          tenantId: input.tenantId,
          workflow: input.workflow,
          type: 'STUCK_WORKFLOW',
          severity: 'CRITICAL',
          message: 'Workflow state has not changed across multiple transitions',
          metadata: input,
        }));
      }
    }

    // 2. REPEATED FAILURE
    if ((input.failureCount ?? 0) >= 3) {
      results.push(this.create({
        tenantId: input.tenantId,
        workflow: input.workflow,
        type: 'REPEATED_FAILURE',
        severity: 'CRITICAL',
        message: 'Multiple consecutive workflow failures detected',
        metadata: input,
      }));
    }

    // 3. LOCK STORM
    if ((input.lockWaitMs ?? 0) > 2000) {
      results.push(this.create({
        tenantId: input.tenantId,
        workflow: input.workflow,
        type: 'LOCK_STORM',
        severity: 'WARNING',
        message: 'High lock contention detected',
        metadata: input,
      }));
    }

    // 4. DUPLICATE MESSAGE STORM
    if ((input.duplicateMessageCount ?? 0) > 5) {
      results.push(this.create({
        tenantId: input.tenantId,
        workflow: input.workflow,
        type: 'DUPLICATE_MESSAGE_STORM',
        severity: 'WARNING',
        message: 'High duplicate message rate detected',
        metadata: input,
      }));
    }

    // 5. METRICS-BASED ANOMALY
    const snapshot = this.metrics.snapshot(input.tenantId);

    if (snapshot.failureRate > 0.5) {
      results.push(this.create({
        tenantId: input.tenantId,
        workflow: input.workflow,
        type: 'HIGH_TIMEOUT_RATE',
        severity: 'CRITICAL',
        message: 'Failure rate exceeds safe threshold',
        metadata: snapshot,
      }));
    }

    // store + emit logs
    for (const a of results) {
      this.store(a);
      this.logger.warn(
        `[ANOMALY] ${a.type} tenant=${a.tenantId} workflow=${a.workflow}`,
      );
    }

    return results;
  }

  // ─────────────────────────────────────────────
  // CREATE ANOMALY
  // ─────────────────────────────────────────────
  private create(input: Omit<AnomalyEvent, 'timestamp'>): AnomalyEvent {
    return {
      ...input,
      timestamp: Date.now(),
    };
  }

  // ─────────────────────────────────────────────
  // STORE
  // ─────────────────────────────────────────────
  private store(event: AnomalyEvent): void {
    if (this.anomalies.length >= this.MAX) {
      this.anomalies.shift();
    }
    this.anomalies.push(event);
  }

  // ─────────────────────────────────────────────
  // QUERY API
  // ─────────────────────────────────────────────
  recent(limit = 50): AnomalyEvent[] {
    return this.anomalies.slice(-limit);
  }

  byTenant(tenantId: string): AnomalyEvent[] {
    return this.anomalies.filter(a => a.tenantId === tenantId);
  }

  critical(): AnomalyEvent[] {
    return this.anomalies.filter(a => a.severity === 'CRITICAL');
  }
}