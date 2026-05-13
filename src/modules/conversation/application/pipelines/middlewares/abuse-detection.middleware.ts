// abuse-detection.middleware.ts
// Detects spam bursts, excessive message length, and known abuse patterns.

import { MiddlewareFn } from '../middleware.pipeline';
import { Logger } from '@nestjs/common';

const logger = new Logger('AbuseDetectionMiddleware');

const ABUSE_PATTERNS = [
  /(.)\1{9,}/,           // 10+ repeated characters: "aaaaaaaaaa"
  /https?:\/\/[^\s]+/gi, // URLs (block in prod if needed)
];

const MAX_MESSAGE_LENGTH = 800;

export const abuseDetectionMiddleware: MiddlewareFn = async (ctx, next) => {
  const message: string = ctx.input?.message ?? '';

  if (message.length > MAX_MESSAGE_LENGTH) {
    logger.warn(`[AbuseDetection] Message too long: ${message.length} chars user=${ctx.input?.userId}`);
    ctx.response = 'Your message is too long. Please keep it under 800 characters.';
    ctx.aborted = true;
    return;
  }

  for (const pattern of ABUSE_PATTERNS) {
    if (pattern.test(message)) {
      logger.warn(`[AbuseDetection] Abuse pattern detected user=${ctx.input?.userId}`);
      ctx.response = 'Your message could not be processed. Please try again.';
      ctx.aborted = true;
      return;
    }
  }

  await next();
};
