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
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.stack.length) return;
      const fn = this.stack[index++];
      await fn(ctx, next);
    };

    await next();
    return ctx;
  }
}
