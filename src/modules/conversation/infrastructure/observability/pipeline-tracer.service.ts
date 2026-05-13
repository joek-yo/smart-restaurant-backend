// FILE: src/modules/conversation/infrastructure/observability/pipeline-tracer.service.ts

import { Injectable, Logger } from '@nestjs/common';

export interface TraceSpan {
  name: string;
  startMs: number;
  endMs?: number;
  durationMs?: number;
  metadata?: Record<string, any>;
  error?: string;
}

export interface PipelineTrace {
  traceId: string;
  tenantId: string;
  userId: string;
  spans: TraceSpan[];
  startMs: number;
  endMs?: number;
  totalDurationMs?: number;
}

@Injectable()
export class PipelineTracerService {
  private readonly logger = new Logger(PipelineTracerService.name);
  private readonly MAX_TRACES = 200;
  private readonly traces: PipelineTrace[] = [];

  // ─── START TRACE ─────────────────────────────────────────
  startTrace(tenantId: string, userId: string): PipelineTrace {
    const trace: PipelineTrace = {
      traceId: `${tenantId}:${userId}:${Date.now()}`,
      tenantId,
      userId,
      spans: [],
      startMs: Date.now(),
    };
    return trace;
  }

  // ─── ADD SPAN ────────────────────────────────────────────
  startSpan(trace: PipelineTrace, name: string, metadata?: Record<string, any>): TraceSpan {
    const span: TraceSpan = { name, startMs: Date.now(), metadata };
    trace.spans.push(span);
    return span;
  }

  endSpan(span: TraceSpan, error?: string): void {
    span.endMs = Date.now();
    span.durationMs = span.endMs - span.startMs;
    if (error) span.error = error;
  }

  // ─── END TRACE ───────────────────────────────────────────
  endTrace(trace: PipelineTrace): void {
    trace.endMs = Date.now();
    trace.totalDurationMs = trace.endMs - trace.startMs;

    if (this.traces.length >= this.MAX_TRACES) this.traces.shift();
    this.traces.push(trace);

    // Log span summary
    const spanSummary = trace.spans
      .map(s => `${s.name}:${s.durationMs ?? '?'}ms`)
      .join(' → ');

    this.logger.debug(
      `[Trace] ${trace.traceId} total=${trace.totalDurationMs}ms | ${spanSummary}`,
    );

    // Warn on any slow span >500ms
    const slowSpans = trace.spans.filter(s => (s.durationMs ?? 0) > 500);
    for (const s of slowSpans) {
      this.logger.warn(
        `[Trace] SLOW SPAN "${s.name}" ${s.durationMs}ms in trace ${trace.traceId}`,
      );
    }
  }

  // ─── GET RECENT TRACES ───────────────────────────────────
  getRecent(limit = 10): PipelineTrace[] {
    return this.traces.slice(-limit);
  }

  // ─── GET TRACE BY ID ─────────────────────────────────────
  getTrace(traceId: string): PipelineTrace | undefined {
    return this.traces.find(t => t.traceId === traceId);
  }
}
