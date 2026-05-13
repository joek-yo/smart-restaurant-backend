// FILE: src/modules/conversation/application/pipelines/middlewares/outbound-dispatch.middleware.ts
// Records the outbound response for audit and queues downstream events.

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';

const logger = new Logger('OutboundDispatchMiddleware');

export const outboundDispatchMiddleware: MiddlewareFn = async (ctx, next) => {
  await next();

  // ==================================================
  // 🔴 HARD STOP: OPT-OUT / PIPELINE STOP CONDITION
  // ==================================================
  if (ctx.stop) {
    logger.warn(
      `[OutboundDispatch] BLOCKED → reason=${ctx.stopReason ?? 'UNKNOWN'} user=${ctx.input?.userId}`,
    );

    return;
  }

  // ==================================================
  // 📦 NORMAL DISPATCH LOGGING
  // ==================================================
  logger.log(
    `[OutboundDispatch] → user=${ctx.input?.userId} intent=${ctx.intent} response="${(ctx.response ?? '').slice(0, 80)}..."`,
  );

  // ==================================================
  // 📤 ATTACH DISPATCH METADATA (ONLY IF ALLOWED)
  // ==================================================
  ctx.dispatched = {
    at: new Date().toISOString(),
    channel: ctx.input?.channel,
    userId: ctx.input?.userId,
    tenantId: ctx.input?.tenantId,
    intent: ctx.intent,
    response: ctx.response,
  };
};