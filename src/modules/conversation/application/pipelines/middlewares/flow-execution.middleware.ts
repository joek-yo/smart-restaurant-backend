// FILE: src/modules/conversation/application/pipelines/middlewares/flow-execution.middleware.ts

import { Logger } from '@nestjs/common';
import { MiddlewareFn } from '../middleware.pipeline';
import { FlowEngine } from '../../flows/flow.engine';

const logger = new Logger('FlowExecutionMiddleware');

export const buildFlowExecutionMiddleware = (
  flowEngine: FlowEngine,
): MiddlewareFn => async (ctx, next) => {

  // Check if user is mid-flow
  const activeFlow = flowEngine.getActiveFlow(ctx);

  if (!activeFlow) {
    await next();
    return;
  }

  logger.log(`[FlowExecution] Resuming flow="${activeFlow}" user=${ctx.input.userId}`);

  const result = await flowEngine.run(activeFlow, ctx);

  if (result.handled) {
    ctx.response = result.response;

    // End flow if complete
    if (result.endFlow) {
      flowEngine.setActiveFlow(ctx, null);
      logger.log(`[FlowExecution] Flow "${activeFlow}" completed`);
    }

    // Transition to next flow if specified
    if (result.nextFlow) {
      flowEngine.setActiveFlow(ctx, result.nextFlow);
      logger.log(`[FlowExecution] Transitioning to flow "${result.nextFlow}"`);
    }

    // Skip rest of pipeline — flow owns the response
    return;
  }

  // Flow didn't handle it — fall through to normal pipeline
  await next();
};
