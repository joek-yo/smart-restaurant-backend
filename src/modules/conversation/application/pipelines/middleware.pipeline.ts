// FILE: src/modules/conversation/application/pipelines/middleware.pipeline.ts

export type PipelineContext = Record<string, any>;

export type MiddlewareFn = (
  ctx: PipelineContext,
  next: () => Promise<void>,
) => Promise<void>;

export class MiddlewarePipeline {
  private readonly stack: MiddlewareFn[] = [];

  use(fn: MiddlewareFn): this {
    this.stack.push(fn);
    return this;
  }

  async run(ctx: PipelineContext): Promise<PipelineContext> {
    // 🔴 GLOBAL OPT-OUT GUARD (must run BEFORE pipeline starts)
    await this.runOptOutGuard(ctx);

    // If user is blocked, stop immediately (hard stop)
    if (ctx.stop) {
      return ctx;
    }

    let index = 0;

    const next = async (): Promise<void> => {
      if (ctx.stop) return; // safety check during execution
      if (index >= this.stack.length) return;

      const fn = this.stack[index++];
      await fn(ctx, next);
    };

    await next();

    return ctx;
  }

  // ==================================================
  // 🔐 GLOBAL OPT-OUT GUARD (SINGLE SOURCE OF TRUTH)
  // ==================================================
  private async runOptOutGuard(ctx: PipelineContext): Promise<void> {
    try {
      const optOutService = ctx.optOutProtectionService;

      if (!optOutService) return; // fail-safe: never block pipeline

      const userId = ctx.userId ?? ctx.input?.userId;
      const tenantId = ctx.tenantId ?? ctx.input?.tenantId;

      if (!userId || !tenantId) return;

      const result = await optOutService.isOptedOut({
        userId,
        tenantId,
      });

      if (result?.isOptedOut) {
        ctx.stop = true;
        ctx.stopReason = 'USER_OPTED_OUT';

        ctx.events = ctx.events || [];
        ctx.events.push({
          type: 'OPT_OUT_BLOCKED',
          userId,
          tenantId,
          reason: result.reason,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      // 🔴 NEVER break pipeline due to opt-out system failure
      ctx.optOutError = err;
    }
  }
}