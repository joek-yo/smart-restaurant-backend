// FILE: src/modules/conversation/application/actions/start-flow.action.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { BaseAction } from './base.action';
import { ActionRegistry } from './action.registry';
import { PipelineContext } from '../pipelines/middleware.pipeline';
import { ConversationIntent } from '../../domain/enums/conversation-intent.enum';
import { FlowEngine } from '../flows/flow.engine';
import { FlowRegistry } from '../flows/flow.registry';

@Injectable()
export class StartFlowAction extends BaseAction implements OnModuleInit {
  intent = ConversationIntent.UNKNOWN;
  private readonly logger = new Logger(StartFlowAction.name);

  constructor(
    private readonly registry: ActionRegistry,
    private readonly flowEngine: FlowEngine,
    private readonly flowRegistry: FlowRegistry,
  ) {
    super();
  }

  onModuleInit() {
    this.registry.register('start-flow', this);
  }

  async execute(ctx: PipelineContext): Promise<void> {
    const flowName: string = (ctx as any).flowName ?? 'onboarding';

    if (!this.flowRegistry.has(flowName)) {
      this.logger.warn(`[StartFlowAction] Flow "${flowName}" not found`);
      ctx.output = { response: "I'm not sure how to help with that. Type *menu* to see options." };
      return;
    }

    // Set active flow in context memory
    this.flowEngine.setActiveFlow(ctx, flowName);

    // Run the first step immediately
    const result = await this.flowEngine.run(flowName, ctx);

    if (result.handled) {
      ctx.output = { response: result.response };

      if (result.endFlow) {
        this.flowEngine.setActiveFlow(ctx, null);
      }
      if (result.nextFlow) {
        this.flowEngine.setActiveFlow(ctx, result.nextFlow);
      }
    }

    this.logger.log(`[StartFlowAction] Started flow="${flowName}" user=${ctx.input.userId}`);
  }
}
