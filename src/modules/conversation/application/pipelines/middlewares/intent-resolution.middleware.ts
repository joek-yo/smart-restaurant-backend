// intent-resolution.middleware.ts
// Runs the resolver chain to determine what the user wants.

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';
import { ResolverRegistry } from '../../resolvers/resolver.registry';

const logger = new Logger('IntentResolutionMiddleware');

export const buildIntentResolutionMiddleware = (
  resolverRegistry: ResolverRegistry,
): MiddlewareFn => async (ctx, next) => {
  ctx.intent = resolverRegistry.resolveIntent(ctx.input.message, ctx);
  logger.debug(`[IntentResolution] intent=${ctx.intent} message="${ctx.input.message}"`);
  await next();
};
