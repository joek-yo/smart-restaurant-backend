// FILE: src/modules/conversation/infrastructure/observability/conversation.metrics.ts

import { Injectable, Logger } from '@nestjs/common';

export interface MetricPoint {
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface PipelineMetric {
  tenantId: string;
  userId: string;
  intent: string;
  durationMs: number;
  success: boolean;
  flowActive?: string;
  timestamp: number;
}

@Injectable()
export class ConversationMetrics {
  private readonly logger = new Logger(ConversationMetrics.name);

  // In-memory ring buffers (last 1000 entries each)
  private readonly MAX = 1000;
  private readonly pipelineRuns: PipelineMetric[] = [];
  private readonly intentCounts = new Map<string, number>();
  private readonly errorCounts = new Map<string, number>();
  private readonly slowPipelines: PipelineMetric[] = [];

  // ─── RECORD PIPELINE RUN ─────────────────────────────────
  record(metric: PipelineMetric): void {
    // Ring buffer
    if (this.pipelineRuns.length >= this.MAX) this.pipelineRuns.shift();
    this.pipelineRuns.push(metric);

    // Intent counter
    const intentKey = metric.intent ?? 'UNKNOWN';
    this.intentCounts.set(intentKey, (this.intentCounts.get(intentKey) ?? 0) + 1);

    // Slow pipeline tracking (>2s)
    if (metric.durationMs > 2000) {
      if (this.slowPipelines.length >= 100) this.slowPipelines.shift();
      this.slowPipelines.push(metric);
      this.logger.warn(
        `[Metrics] SLOW tenant=${metric.tenantId} user=${metric.userId} ` +
        `intent=${metric.intent} duration=${metric.durationMs}ms`,
      );
    }

    // Error counter
    if (!metric.success) {
      this.errorCounts.set(
        metric.tenantId,
        (this.errorCounts.get(metric.tenantId) ?? 0) + 1,
      );
    }
  }

  // ─── SUMMARY SNAPSHOT ────────────────────────────────────
  summary(): {
    totalRuns: number;
    avgDurationMs: number;
    p95DurationMs: number;
    intentBreakdown: Record<string, number>;
    errorsByTenant: Record<string, number>;
    slowPipelineCount: number;
  } {
    const durations = this.pipelineRuns.map(r => r.durationMs).sort((a, b) => a - b);
    const avg = durations.length
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : 0;
    const p95idx = Math.floor(durations.length * 0.95);
    const p95 = durations[p95idx] ?? 0;

    return {
      totalRuns: this.pipelineRuns.length,
      avgDurationMs: avg,
      p95DurationMs: p95,
      intentBreakdown: Object.fromEntries(this.intentCounts),
      errorsByTenant: Object.fromEntries(this.errorCounts),
      slowPipelineCount: this.slowPipelines.length,
    };
  }

  // ─── RECENT RUNS ─────────────────────────────────────────
  recent(limit = 20): PipelineMetric[] {
    return this.pipelineRuns.slice(-limit);
  }

  // ─── RESET (for testing) ─────────────────────────────────
  reset(): void {
    this.pipelineRuns.length = 0;
    this.intentCounts.clear();
    this.errorCounts.clear();
    this.slowPipelines.length = 0;
  }
}
