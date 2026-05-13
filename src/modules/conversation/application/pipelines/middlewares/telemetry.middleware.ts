// FILE: src/modules/conversation/application/pipelines/middlewares/telemetry.middleware.ts

import { Logger } from '@nestjs/common';
import { MiddlewareFn } from '../middleware.pipeline';
import { ConversationMetrics } from '../../../infrastructure/observability/conversation.metrics';
import { PipelineTracerService } from '../../../infrastructure/observability/pipeline-tracer.service';
import { OrchestrationLoggerService } from '../../../infrastructure/observability/orchestration-logger.service';

const logger = new Logger('TelemetryMiddleware');

export const buildTelemetryMiddleware = (
  metrics: ConversationMetrics,
  tracer: PipelineTracerService,
  orchLogger: OrchestrationLoggerService,
): MiddlewareFn => async (ctx, next) => {

  const startMs = Date.now();
  const trace = tracer.startTrace(ctx.input.tenantId, ctx.input.userId);
  ctx.telemetry = { startMs, stages: [], traceId: trace.traceId };

  orchLogger.info('Pipeline', 'started', {
    tenantId: ctx.input.tenantId,
    userId: ctx.input.userId,
  });

  let success = true;

  try {
    await next();
  } catch (err: any) {
    success = false;
    orchLogger.error('Pipeline', `failed: ${err?.message}`, {
      tenantId: ctx.input.tenantId,
      userId: ctx.input.userId,
    });
    throw err;
  } finally {
    const durationMs = Date.now() - startMs;
    ctx.telemetry.durationMs = durationMs;

    tracer.endTrace(trace);

    metrics.record({
      tenantId: ctx.input.tenantId,
      userId: ctx.input.userId,
      intent: ctx.intent ?? 'UNKNOWN',
      durationMs,
      success,
      flowActive: ctx.context?.getMemory('flow:currentFlow') as string | undefined,
      timestamp: Date.now(),
    });

    orchLogger.info('Pipeline', 'completed', {
      tenantId: ctx.input.tenantId,
      userId: ctx.input.userId,
      durationMs,
      metadata: { intent: ctx.intent ?? 'UNKNOWN', success },
    });

    logger.log(
      `[Telemetry] tenant=${ctx.input?.tenantId} user=${ctx.input?.userId} ` +
      `intent=${ctx.intent ?? 'UNKNOWN'} duration=${durationMs}ms success=${success}`,
    );

    if (durationMs > 3000) {
      logger.warn(`[Telemetry] SLOW PIPELINE: ${durationMs}ms user=${ctx.input?.userId}`);
    }
  }
};

// Keep the old stateless export for backward compat — replaced by builder above
export const telemetryMiddleware: MiddlewareFn = async (ctx, next) => {
  const startMs = Date.now();
  ctx.telemetry = { startMs, stages: [] };
  await next();
  const durationMs = Date.now() - startMs;
  ctx.telemetry.durationMs = durationMs;
  logger.log(
    `[Telemetry] tenant=${ctx.input?.tenantId} user=${ctx.input?.userId} ` +
    `intent=${ctx.intent ?? 'UNKNOWN'} duration=${durationMs}ms`,
  );
};
