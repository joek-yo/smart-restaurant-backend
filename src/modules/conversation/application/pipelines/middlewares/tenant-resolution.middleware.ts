// tenant-resolution.middleware.ts
// Validates that tenantId is present and well-formed. Blocks unroutable messages early.

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';

const logger = new Logger('TenantResolutionMiddleware');

export const tenantResolutionMiddleware: MiddlewareFn = async (ctx, next) => {
  const tenantId: string = ctx.input?.tenantId;

  if (!tenantId || tenantId.trim().length < 3) {
    logger.warn(`[TenantResolution] Invalid or missing tenantId: "${tenantId}"`);
    ctx.response = 'Unable to process your request. Invalid tenant context.';
    ctx.aborted = true;
    return;
  }

  ctx.tenantId = tenantId.trim();
  logger.debug(`[TenantResolution] tenant=${ctx.tenantId}`);

  await next();
};
