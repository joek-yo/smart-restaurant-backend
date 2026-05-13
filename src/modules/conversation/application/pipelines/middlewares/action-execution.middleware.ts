// action-execution.middleware.ts
// Finds and executes the action registered for the resolved intent.

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';
import { ActionRegistry } from '../../actions/action.registry';

const logger = new Logger('ActionExecutionMiddleware');

export const buildActionExecutionMiddleware = (
  actionRegistry: ActionRegistry,
): MiddlewareFn => async (ctx, next) => {
  const intentKey = (ctx.intent ?? '').toLowerCase().replace(/_/g, '-');
  const action = actionRegistry.resolve(intentKey);

  if (action) {
    logger.debug(`[ActionExecution] Executing action for intent: ${ctx.intent}`);
    await action.execute(ctx);
  } else {
    logger.debug(`[ActionExecution] No action for intent: ${ctx.intent} — skipping`);
  }

  await next();
};
