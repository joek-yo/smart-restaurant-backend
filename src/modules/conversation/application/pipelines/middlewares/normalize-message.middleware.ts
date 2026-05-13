// normalize-message.middleware.ts
// Ensures input is clean, trimmed, and within length limits before pipeline proceeds.

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';

const logger = new Logger('NormalizeMessageMiddleware');

export const normalizeMessageMiddleware: MiddlewareFn = async (ctx, next) => {
  const raw: string = ctx.input?.message ?? '';

  const normalized = raw.trim().toLowerCase().slice(0, 1000);

  if (!normalized) {
    ctx.response = 'Please send a message so I can help you.';
    ctx.aborted = true;
    return;
  }

  ctx.input = { ...ctx.input, message: normalized, rawMessage: raw };
  logger.debug(`[Normalize] "${raw}" → "${normalized}"`);

  await next();
};
