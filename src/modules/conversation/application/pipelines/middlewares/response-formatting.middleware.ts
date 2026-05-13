// response-formatting.middleware.ts
// Ensures response is always a clean string. Applies channel-specific formatting.

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';

const logger = new Logger('ResponseFormattingMiddleware');

const MAX_RESPONSE_LENGTH = 4096; // WhatsApp limit

export const responseFormattingMiddleware: MiddlewareFn = async (ctx, next) => {
  await next();

  let response: string = ctx.output?.response ?? ctx.response ?? 'How can I help you?';

  // Trim to channel limits
  if (response.length > MAX_RESPONSE_LENGTH) {
    response = response.slice(0, MAX_RESPONSE_LENGTH - 3) + '...';
  }

  // Channel-specific cleanup
  const channel = ctx.input?.channel ?? 'api';
  if (channel === 'whatsapp') {
    // WhatsApp renders *bold* and _italic_ natively — keep as-is
    response = response.trim();
  } else {
    response = response.trim();
  }

  ctx.response = response;
  logger.debug(`[ResponseFormatting] channel=${channel} length=${response.length}`);
};
