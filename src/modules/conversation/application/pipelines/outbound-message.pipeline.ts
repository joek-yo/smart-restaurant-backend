// FILE: src/modules/conversation/application/pipelines/outbound-message.pipeline.ts

import { Injectable } from '@nestjs/common';
import { MiddlewarePipeline, PipelineContext } from './middleware.pipeline';

@Injectable()
export class OutboundMessagePipeline {
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const pipeline = new MiddlewarePipeline();

    // ==================================================
    // 🔴 FINAL OUTBOUND SAFETY GATE (CRITICAL)
    // ==================================================
    pipeline.use(async (ctx, next) => {
      // Hard stop: NEVER send messages to opted-out users
      if (ctx.stop || ctx.stopReason === 'USER_OPTED_OUT') {
        ctx.blockedOutbound = true;

        ctx.events = ctx.events || [];
        ctx.events.push({
          type: 'OUTBOUND_BLOCKED_OPT_OUT',
          userId: ctx.userId ?? ctx.input?.userId,
          tenantId: ctx.tenantId ?? ctx.input?.tenantId,
          timestamp: new Date(),
        });

        return; // stop pipeline immediately
      }

      await next();
    });

    // ==================================================
    // 📤 OUTBOUND ENRICHMENT (safe to extend later)
    // ==================================================
    pipeline.use(async (ctx, next) => {
      ctx.dispatchedAt = new Date().toISOString();
      ctx.channel = ctx.input?.channel;

      await next();
    });

    // ==================================================
    // 🚀 EXECUTE PIPELINE
    // ==================================================
    return pipeline.run(ctx);
  }
}