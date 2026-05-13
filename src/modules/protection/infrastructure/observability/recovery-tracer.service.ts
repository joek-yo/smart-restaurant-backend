// FILE: src/modules/protection/infrastructure/observability/recovery-tracer.service.ts

import { Injectable, Logger } from '@nestjs/common';

export interface RecoverySpan {
  name: string;
  startMs: number;
  endMs?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface RecoveryTrace {
  traceId: string;
  tenantId: string;
  userId: string;

  reason?: string;
  workflow?: string;

  spans: RecoverySpan[];

  startMs: number;
  endMs?: number;
  totalDurationMs?: number;
}

/**
 * RecoveryTracerService
 * ---------------------
 * Captures full lifecycle tracing for recovery execution flows:
 * - recovery detection
 * - state restoration
 * - repair execution
 * - failure analysis
 *
 * This is the "black box recorder" for recovery engine behavior.
 */
@Injectable()
export class RecoveryTracerService {
  private readonly logger = new Logger(RecoveryTracerService.name);

  private readonly MAX_TRACES = 300;
  private readonly traces: RecoveryTrace[] = [];

  // ─────────────────────────────────────────────
  // TRACE START
  // ─────────────────────────────────────────────
  startTrace(input: {
    tenantId: string;
    userId: string;
    reason?: string;
    workflow?: string;
  }): RecoveryTrace {
    return {
      traceId: `${input.tenantId}:${input.userId}:${Date.now()}`,
      tenantId: input.tenantId,
      userId: input.userId,
      reason: input.reason,
      workflow: input.workflow,
      spans: [],
      startMs: Date.now(),
    };
  }

  // ─────────────────────────────────────────────
  // SPAN MANAGEMENT
  // ─────────────────────────────────────────────
  startSpan(trace: RecoveryTrace, name: string, metadata?: Record<string, any>): RecoverySpan {
    const span: RecoverySpan = {
      name,
      startMs: Date.now(),
      metadata,
    };

    trace.spans.push(span);
    return span;
  }

  endSpan(span: RecoverySpan, error?: string): void {
    span.endMs = Date.now();
    span.durationMs = span.endMs - span.startMs;

    if (error) {
      span.error = error;
    }
  }

  // ─────────────────────────────────────────────
  // TRACE FINALIZATION
  // ─────────────────────────────────────────────
  endTrace(trace: RecoveryTrace): void {
    trace.endMs = Date.now();
    trace.totalDurationMs = trace.endMs - trace.startMs;

    if (this.traces.length >= this.MAX_TRACES) {
      this.traces.shift();
    }

    this.traces.push(trace);

    const spanSummary = trace.spans
      .map(s => `${s.name}:${s.durationMs ?? '?'}ms`)
      .join(' → ');

    this.logger.debug(
      `[RECOVERY_TRACE] ${trace.traceId} total=${trace.totalDurationMs}ms | ${spanSummary}`,
    );

    const slowSpans = trace.spans.filter(s => (s.durationMs ?? 0) > 500);

    for (const span of slowSpans) {
      this.logger.warn(
        `[RECOVERY_TRACE] SLOW SPAN "${span.name}" ${span.durationMs}ms trace=${trace.traceId}`,
      );
    }
  }

  // ─────────────────────────────────────────────
  // QUERY API
  // ─────────────────────────────────────────────
  getRecent(limit = 20): RecoveryTrace[] {
    return this.traces.slice(-limit);
  }

  getTrace(traceId: string): RecoveryTrace | undefined {
    return this.traces.find(t => t.traceId === traceId);
  }

  byTenant(tenantId: string, limit = 20): RecoveryTrace[] {
    return this.traces
      .filter(t => t.tenantId === tenantId)
      .slice(-limit);
  }
}