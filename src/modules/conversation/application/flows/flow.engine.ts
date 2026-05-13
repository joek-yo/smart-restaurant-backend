// FILE: src/modules/conversation/application/flows/flow.engine.ts

import { Injectable, Logger } from '@nestjs/common';
import { FlowRegistry } from './flow.registry';
import { PipelineContext } from '../pipelines/middleware.pipeline';

export interface FlowResult {
  handled: boolean;
  response?: string;
  nextFlow?: string;
  endFlow?: boolean;
}

@Injectable()
export class FlowEngine {
  private readonly logger = new Logger(FlowEngine.name);

  constructor(private readonly registry: FlowRegistry) {}

  async run(flowName: string, ctx: PipelineContext): Promise<FlowResult> {
    const flow = this.registry.get(flowName);

    if (!flow) {
      this.logger.warn(`[FlowEngine] Unknown flow: ${flowName}`);
      return { handled: false };
    }

    this.logger.log(`[FlowEngine] Running flow: ${flowName} user=${ctx.input.userId}`);

    try {
      return await flow.execute(ctx);
    } catch (err: any) {
      this.logger.error(`[FlowEngine] Flow "${flowName}" error: ${err?.message}`);
      return { handled: false };
    }
  }

  // Determines if a user is currently mid-flow based on vault state
  getActiveFlow(ctx: PipelineContext): string | null {
    return ctx.context?.getMemory('flow:currentFlow') as string | undefined ?? null;
  }

  setActiveFlow(ctx: PipelineContext, flowName: string | null): void {
    if (flowName) {
      ctx.context?.setMemory('flow:currentFlow', flowName);
    } else {
      if (ctx.context?.memory) delete ctx.context.memory['flow:currentFlow'];
    }
  }
}
